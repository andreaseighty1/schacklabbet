-- Track actual game activity and bound reads as well as writes.
-- This migration does NOT delete users or schedule account deletion.
begin;

create table chess_private.player_activity (
  actor uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);
alter table chess_private.player_activity enable row level security;
revoke all on chess_private.player_activity from public, anon, authenticated;
create index player_activity_last_seen on chess_private.player_activity(last_seen_at);

-- Existing anonymous accounts receive a full 30-day grace period on installation.
insert into chess_private.player_activity(actor)
  select id from auth.users where is_anonymous is true;

-- Keep all installed clock, move, invite and hourly-limit rules intact.
alter function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)
  set schema chess_private;
alter function chess_private.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)
  rename to room_command_v1;
revoke all on function chess_private.room_command_v1(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)
  from public, anon, authenticated, service_role;

create function public.chess_room_command(
  p_actor uuid, p_action text, p_id uuid default null, p_code text default null,
  p_color text default 'w', p_version integer default null, p_moves jsonb default null,
  p_status text default null, p_result text default null, p_reason text default null,
  p_request uuid default null, p_settings jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare requests integer;
begin
  if p_actor is null or p_action is null or p_action not in ('create','join','get','resume','commit') then
    return jsonb_build_object('error','not_found');
  end if;
  -- Shared with writes and account cleanup. Never trust an actor supplied by a browser.
  perform pg_advisory_xact_lock(hashtextextended(p_actor::text,0));
  if not exists (select 1 from auth.users where id=p_actor) then
    return jsonb_build_object('error','not_found');
  end if;
  insert into chess_private.request_limits(actor,action,bucket,count)
    values(p_actor,'api',date_trunc('minute',now()),1)
    on conflict(actor,action,bucket) do update
      set count=least(chess_private.request_limits.count+1,121)
    returning count into requests;
  if requests>120 then return jsonb_build_object('error','rate_limited'); end if;
  insert into chess_private.player_activity(actor) values(p_actor)
    on conflict(actor) do update set last_seen_at=now()
    where chess_private.player_activity.last_seen_at<now()-interval '1 minute';
  begin
    return chess_private.room_command_v1(p_actor,p_action,p_id,p_code,p_color,p_version,
      p_moves,p_status,p_result,p_reason,p_request,p_settings);
  exception when raise_exception then
    -- Preserve the outer rate counter even when the game rejects a stale/unknown request.
    if sqlerrm in ('not_found','conflict') then return jsonb_build_object('error',sqlerrm); end if;
    raise;
  end;
end;
$$;
revoke all on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)
  to service_role;

-- A private preview, also rechecked under the actor lock by cleanup.
create function chess_private.inactive_players() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select u.id from auth.users u join chess_private.player_activity a on a.actor=u.id
  where u.is_anonymous is true and coalesce(u.email,'')='' and coalesce(u.phone,'')=''
    and u.created_at<now()-interval '30 days'
    and coalesce(u.last_sign_in_at,u.created_at)<now()-interval '30 days'
    and a.last_seen_at<now()-interval '30 days'
    and not exists(select 1 from public.chess_rooms r
      where (r.creator_id=u.id or r.white_id=u.id or r.black_id=u.id)
        and r.status in ('waiting','playing') and r.expires_at>now())
  order by a.last_seen_at,u.id;
$$;

create function chess_private.cleanup_inactive_players(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare candidate uuid; removed integer:=0; matched integer; affected integer;
begin
  select count(*) into matched from chess_private.inactive_players();
  if p_dry_run is distinct from false then
    return jsonb_build_object('eligible',matched,'deleted',0,'dry_run',true);
  end if;
  -- At most 100 per run. Failed locks are retried at the next scheduled run.
  for candidate in select * from chess_private.inactive_players() limit 100 loop
    if pg_try_advisory_xact_lock(hashtextextended(candidate::text,0)) then
      delete from auth.users u where u.id=candidate
        and u.id in (select * from chess_private.inactive_players());
      get diagnostics affected=row_count;
      removed:=removed+affected;
    end if;
  end loop;
  return jsonb_build_object('eligible',matched,'deleted',removed,'dry_run',false);
end;
$$;
revoke all on function chess_private.inactive_players() from public,anon,authenticated,service_role;
revoke all on function chess_private.cleanup_inactive_players(boolean) from public,anon,authenticated,service_role;

commit;
