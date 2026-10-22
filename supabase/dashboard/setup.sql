-- Private, short-lived games. Only the verified Edge Function can mutate them.
begin;
create schema if not exists chess_private;
revoke all on schema chess_private from public, anon, authenticated;

create table public.chess_rooms (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users(id) on delete cascade,
  white_id uuid references auth.users(id) on delete cascade,
  black_id uuid references auth.users(id) on delete cascade,
  version integer not null default 0 check (version >= 0),
  moves jsonb not null default '[]'::jsonb check (jsonb_typeof(moves) = 'array'),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'cancelled')),
  result text check (result in ('1-0', '0-1', '1/2-1/2')),
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  last_request uuid,
  last_actor uuid,
  check (white_id is distinct from black_id),
  check (creator_id is not distinct from white_id or creator_id is not distinct from black_id),
  check (status = 'waiting' or status = 'cancelled' or (white_id is not null and black_id is not null)),
  check ((status = 'finished' and result is not null) or (status <> 'finished' and result is null))
);
create index chess_rooms_white on public.chess_rooms(white_id);
create index chess_rooms_black on public.chess_rooms(black_id);
create index chess_rooms_expiry on public.chess_rooms(expires_at);
alter table public.chess_rooms enable row level security;
revoke all on public.chess_rooms from anon, authenticated;
grant select on public.chess_rooms to authenticated;
grant all on public.chess_rooms to service_role;
create policy "Participants read their unexpired game" on public.chess_rooms
  for select to authenticated using (
    ((select auth.uid()) = white_id or (select auth.uid()) = black_id) and expires_at > now()
  );

create table chess_private.room_codes (
  room_id uuid primary key references public.chess_rooms(id) on delete cascade,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{10}$')
);
create table chess_private.request_limits (
  actor uuid not null references auth.users(id) on delete cascade,
  action text not null,
  bucket timestamptz not null,
  count integer not null,
  primary key (actor, action, bucket)
);
alter table chess_private.room_codes enable row level security;
alter table chess_private.request_limits enable row level security;
revoke all on all tables in schema chess_private from public, anon, authenticated;

-- All identity parameters come from a verified Auth response in the Edge Function.
-- The RPC itself is executable only by service_role, never by a browser session.
create function public.chess_room_command(
  p_actor uuid, p_action text, p_id uuid default null, p_code text default null,
  p_color text default 'w', p_version integer default null, p_moves jsonb default null,
  p_status text default null, p_result text default null, p_reason text default null,
  p_request uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  room public.chess_rooms;
  invite text;
  requests integer;
  maximum integer;
begin
  if p_actor is null or p_action not in ('create','join','get','resume','commit') then
    raise exception 'not_found';
  end if;
  if p_action in ('create','join','commit') then
    -- Shared transaction lock also prevents one account creating/joining two games concurrently.
    perform pg_advisory_xact_lock(hashtextextended(p_actor::text, 0));
    maximum := case p_action when 'create' then 10 when 'join' then 60 else 600 end;
    insert into chess_private.request_limits(actor, action, bucket, count)
    values (p_actor, p_action, date_trunc('hour', now()), 1)
    on conflict (actor, action, bucket) do update set count = chess_private.request_limits.count + 1
    returning count into requests;
    -- Return, rather than raise, so failed join attempts still count toward the limit.
    if requests > maximum then return jsonb_build_object('error', 'rate_limited'); end if;
  end if;

  if p_action in ('create','resume') then
    select * into room from public.chess_rooms
      where (white_id = p_actor or black_id = p_actor)
        and status in ('waiting','playing') and expires_at > now()
      order by created_at desc limit 1;
    if p_action = 'create' and room.id is null then
      if p_color not in ('w','b') or p_code is null or p_code !~ '^[A-HJ-NP-Z2-9]{10}$' then raise exception 'not_found'; end if;
      insert into public.chess_rooms(creator_id, white_id, black_id)
        values (p_actor, case when p_color = 'w' then p_actor end, case when p_color = 'b' then p_actor end)
        returning * into room;
      insert into chess_private.room_codes(room_id, code) values (room.id, p_code);
    end if;
  elsif p_action = 'join' then
    -- All unsuccessful guesses give the same response, including closed/expired codes.
    select r.* into room from public.chess_rooms r
      join chess_private.room_codes c on c.room_id = r.id
      where c.code = p_code and r.expires_at > now()
      for update of r;
    if room.id is null or room.status not in ('waiting','playing') then
      return jsonb_build_object('error', 'not_found');
    end if;
    if room.white_id = p_actor or room.black_id = p_actor then
      if room.status = 'waiting' then return jsonb_build_object('error', 'own_room'); end if;
      -- Retried successful join returns the same seat.
    else
      if room.status <> 'waiting' then return jsonb_build_object('error', 'not_found'); end if;
      if exists (select 1 from public.chess_rooms where
        (white_id = p_actor or black_id = p_actor) and status in ('waiting','playing') and expires_at > now()) then
        return jsonb_build_object('error', 'active_room');
      end if;
      update public.chess_rooms set
        white_id = coalesce(white_id, p_actor), black_id = coalesce(black_id, p_actor),
        status = 'playing', version = version + 1
        where id = room.id returning * into room;
    end if;
  else
    select * into room from public.chess_rooms where id = p_id
      and (white_id = p_actor or black_id = p_actor) and expires_at > now() for update;
    if room.id is null then raise exception 'not_found'; end if;
    if p_action = 'commit' then
      if room.last_request = p_request and room.last_actor = p_actor then
        return jsonb_build_object('room', to_jsonb(room));
      end if;
      if room.version <> p_version or p_request is null then raise exception 'conflict'; end if;
      if room.status = 'waiting' then
        if room.creator_id <> p_actor or p_status <> 'cancelled' or p_moves <> room.moves or p_result is not null then raise exception 'conflict'; end if;
      elsif room.status = 'playing' then
        if p_status not in ('playing','finished') then raise exception 'conflict'; end if;
        if p_reason = 'resignation' then
          if p_moves <> room.moves or p_status <> 'finished' or
            p_result <> (case when room.white_id = p_actor then '0-1' else '1-0' end) then raise exception 'conflict'; end if;
        else
          if (jsonb_array_length(room.moves) % 2 = 0) <> (room.white_id = p_actor)
            or jsonb_array_length(p_moves) <> jsonb_array_length(room.moves) + 1
            or p_moves - (jsonb_array_length(p_moves) - 1) <> room.moves then raise exception 'conflict'; end if;
        end if;
      else raise exception 'conflict';
      end if;
      -- One locked version is committed. Stale moves cannot overwrite a newer board.
      update public.chess_rooms set moves = p_moves, status = p_status, result = p_result,
        reason = p_reason, version = version + 1, last_request = p_request, last_actor = p_actor
        where id = room.id returning * into room;
    end if;
  end if;
  if room.id is not null and room.creator_id = p_actor and room.status = 'waiting' then
    select code into invite from chess_private.room_codes where room_id = room.id;
  end if;
  return jsonb_build_object('room', case when room.id is null then null else to_jsonb(room) end, 'code', invite);
end;
$$;
revoke all on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid) to service_role;

-- Only this table is added; existing publication members are preserved.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chess_rooms') then
    alter publication supabase_realtime add table public.chess_rooms;
  end if;
end $$;
commit;


-- Expired games and invite codes are removed hourly; unrelated data is untouched.
create extension if not exists pg_cron;
select cron.schedule(
  'schacklabbet-expired-rooms', '13 * * * *',
  $job$
    delete from public.chess_rooms where expires_at < now();
    delete from chess_private.request_limits where bucket < now() - interval '2 days';
  $job$
);


-- Additive upgrade: existing games continue without clocks and old invitations still work.
begin;
alter table public.chess_rooms
  add column clock_minutes integer not null default 0 check (clock_minutes in (0,10,15)),
  add column max_minutes integer not null default 0 check (max_minutes in (0,20,30,45,60)),
  add column white_ms bigint check (white_ms >= 0),
  add column black_ms bigint check (black_ms >= 0),
  add column started_at timestamptz,
  add column turn_started_at timestamptz,
  add column draw_offer text check (draw_offer in ('w','b')),
  add column white_can_mate boolean not null default true,
  add column black_can_mate boolean not null default true;
alter table chess_private.room_codes drop constraint room_codes_code_check;
alter table chess_private.room_codes add constraint room_codes_code_check
  check (code ~ '^([A-HJ-NP-Z2-9]{6}|[A-HJ-NP-Z2-9]{10})$');

-- Called by RPC reads/commits and a minute job, so a closed browser cannot pause time.
create function chess_private.settle_clock(p_id uuid, p_at timestamptz default clock_timestamp()) returns public.chess_rooms
language plpgsql security definer set search_path = '' as $$
declare
  room public.chess_rooms;
  instant timestamptz;
  deadline timestamptz;
  elapsed bigint;
  white_turn boolean;
  can_mate boolean;
  limited boolean := false;
begin
  select * into room from public.chess_rooms where id = p_id for update;
  if room.id is null or room.status <> 'playing' or room.turn_started_at is null then return room; end if;
  instant := p_at;
  white_turn := jsonb_array_length(room.moves) % 2 = 0;
  if room.clock_minutes > 0 then
    deadline := room.turn_started_at + (case when white_turn then room.white_ms else room.black_ms end) * interval '1 millisecond';
  end if;
  if room.max_minutes > 0 and room.started_at is not null and
    (deadline is null or room.started_at + room.max_minutes * interval '1 minute' <= deadline) then
    deadline := room.started_at + room.max_minutes * interval '1 minute';
    limited := true;
  end if;
  if deadline is null or instant < deadline then return room; end if;
  elapsed := greatest(0,floor(extract(epoch from (deadline - room.turn_started_at))*1000))::bigint;
  can_mate := case when white_turn then room.black_can_mate else room.white_can_mate end;
  update public.chess_rooms set
    status = 'finished', version = version + 1,
    result = case when limited or not can_mate then '1/2-1/2' when white_turn then '0-1' else '1-0' end,
    reason = case when limited then 'time_limit' when not can_mate then 'timeout_material' else 'timeout' end,
    white_ms = case when white_ms is null then null when white_turn then greatest(0,white_ms-elapsed) else white_ms end,
    black_ms = case when black_ms is null then null when not white_turn then greatest(0,black_ms-elapsed) else black_ms end,
    turn_started_at = null, draw_offer = null
    where id = room.id returning * into room;
  return room;
end;
$$;
revoke all on function chess_private.settle_clock(uuid,timestamptz) from public,anon,authenticated;
grant execute on function chess_private.settle_clock(uuid,timestamptz) to service_role;

-- Replace the service-only signature rather than leave an ambiguous PostgREST overload.
drop function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid);
create function public.chess_room_command(
  p_actor uuid, p_action text, p_id uuid default null, p_code text default null,
  p_color text default 'w', p_version integer default null, p_moves jsonb default null,
  p_status text default null, p_result text default null, p_reason text default null,
  p_request uuid default null, p_settings jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  room public.chess_rooms;
  invite text;
  requests integer;
  maximum integer;
  instant timestamptz;
  elapsed bigint;
  n integer;
  operation text := coalesce(p_settings->>'operation','move');
begin
  if p_actor is null or p_action not in ('create','join','get','resume','commit') then
    raise exception 'not_found';
  end if;
  if p_action in ('create','join','commit') then
    -- Shared transaction lock also prevents one account creating/joining two games concurrently.
    perform pg_advisory_xact_lock(hashtextextended(p_actor::text, 0));
    maximum := case p_action when 'create' then 10 when 'join' then 60 else 600 end;
    insert into chess_private.request_limits(actor, action, bucket, count)
    values (p_actor, p_action, date_trunc('hour', now()), 1)
    on conflict (actor, action, bucket) do update set count = chess_private.request_limits.count + 1
    returning count into requests;
    -- Return, rather than raise, so failed join attempts still count toward the limit.
    if requests > maximum then return jsonb_build_object('error', 'rate_limited'); end if;
  end if;

  -- Settle expired clocks before testing whether this actor already has an active game.
  perform chess_private.settle_clock(id) from public.chess_rooms
    where (white_id = p_actor or black_id = p_actor) and status = 'playing' and expires_at > now();
  if p_action in ('create','resume') then
    select * into room from public.chess_rooms
      where (white_id = p_actor or black_id = p_actor)
        and status in ('waiting','playing') and expires_at > now()
      order by created_at desc limit 1;
    if p_action = 'create' and room.id is null then
      if p_color not in ('w','b') or p_code is null or p_code !~ '^([A-HJ-NP-Z2-9]{6}|[A-HJ-NP-Z2-9]{10})$' then raise exception 'not_found'; end if;
      if coalesce((p_settings->>'clock_minutes')::integer,0) not in (0,10,15)
        or coalesce((p_settings->>'max_minutes')::integer,0) not in (0,20,30,45,60) then raise exception 'conflict'; end if;
      begin
        insert into public.chess_rooms(creator_id, white_id, black_id,clock_minutes,max_minutes,white_ms,black_ms)
          values (p_actor, case when p_color = 'w' then p_actor end, case when p_color = 'b' then p_actor end,
            coalesce((p_settings->>'clock_minutes')::integer,0),coalesce((p_settings->>'max_minutes')::integer,0),
            nullif((p_settings->>'clock_minutes')::integer,0)*60000,nullif((p_settings->>'clock_minutes')::integer,0)*60000)
          returning * into room;
        insert into chess_private.room_codes(room_id, code) values (room.id, p_code);
      exception when unique_violation then
        return jsonb_build_object('error','code_collision');
      end;
    end if;
  elsif p_action = 'join' then
    -- All unsuccessful guesses give the same response, including closed/expired codes.
    select r.* into room from public.chess_rooms r
      join chess_private.room_codes c on c.room_id = r.id
      where c.code = p_code and r.expires_at > now()
      for update of r;
    if room.id is null or room.status not in ('waiting','playing') then
      return jsonb_build_object('error', 'not_found');
    end if;
    if room.white_id = p_actor or room.black_id = p_actor then
      if room.status = 'waiting' then return jsonb_build_object('error', 'own_room'); end if;
      -- Retried successful join returns the same seat.
    else
      if room.status <> 'waiting' then return jsonb_build_object('error', 'not_found'); end if;
      if exists (select 1 from public.chess_rooms where
        (white_id = p_actor or black_id = p_actor) and status in ('waiting','playing') and expires_at > now()) then
        return jsonb_build_object('error', 'active_room');
      end if;
      update public.chess_rooms set
        white_id = coalesce(white_id, p_actor), black_id = coalesce(black_id, p_actor),
        status = 'playing', started_at = clock_timestamp(), turn_started_at = clock_timestamp(), version = version + 1
        where id = room.id returning * into room;
    end if;
  else
    select * into room from public.chess_rooms where id = p_id
      and (white_id = p_actor or black_id = p_actor) and expires_at > now() for update;
    if room.id is null then raise exception 'not_found'; end if;
    room := chess_private.settle_clock(room.id);
    if p_action = 'commit' then
      if room.status = 'finished' and room.reason in ('timeout','timeout_material','time_limit') then
        return jsonb_build_object('room',to_jsonb(room),'server_now',clock_timestamp());
      end if;
      if room.last_request = p_request and room.last_actor = p_actor then
        return jsonb_build_object('room', to_jsonb(room),'server_now',clock_timestamp());
      end if;
      if room.version <> p_version or p_request is null then raise exception 'conflict'; end if;
      if room.status = 'waiting' then
        if room.creator_id <> p_actor or p_status <> 'cancelled' or p_moves <> room.moves or p_result is not null then raise exception 'conflict'; end if;
      elsif room.status = 'playing' then
        if p_status not in ('playing','finished') then raise exception 'conflict'; end if;
        if p_reason = 'resignation' then
          if p_moves <> room.moves or p_status <> 'finished' or
            p_result <> (case when room.white_id = p_actor then '0-1' else '1-0' end) then raise exception 'conflict'; end if;
        elsif operation in ('offer_draw','accept_draw','decline_draw') then
          if p_moves <> room.moves then raise exception 'conflict'; end if;
          if operation = 'offer_draw' then
            if room.draw_offer is not null or p_status <> 'playing' or p_result is not null
              or p_settings->>'draw_offer' <> (case when room.white_id = p_actor then 'w' else 'b' end) then raise exception 'conflict'; end if;
          else
            if room.draw_offer is null or room.draw_offer = (case when room.white_id = p_actor then 'w' else 'b' end) then raise exception 'conflict'; end if;
            if operation = 'accept_draw' then
              if p_status <> 'finished' or p_result <> '1/2-1/2' or p_reason <> 'agreement' then raise exception 'conflict'; end if;
            elsif p_status <> 'playing' or p_result is not null then raise exception 'conflict'; end if;
          end if;
        else
          if (jsonb_array_length(room.moves) % 2 = 0) <> (room.white_id = p_actor)
            or jsonb_array_length(p_moves) <> jsonb_array_length(room.moves) + 1
            or p_moves - (jsonb_array_length(p_moves) - 1) <> room.moves then raise exception 'conflict'; end if;
        end if;
      else raise exception 'conflict';
      end if;
      -- Settle again immediately before commit, after the row lock. An expiry wins a race with a move.
      instant := clock_timestamp();
      room := chess_private.settle_clock(room.id,instant);
      if room.status = 'finished' and room.reason in ('timeout','timeout_material','time_limit') then
        return jsonb_build_object('room',to_jsonb(room),'server_now',clock_timestamp());
      end if;
      elapsed := greatest(0,floor(extract(epoch from (instant - room.turn_started_at))*1000))::bigint;
      n := jsonb_array_length(room.moves);
      -- One locked version is committed. Stale moves cannot overwrite a newer board.
      update public.chess_rooms set moves = p_moves, status = p_status, result = p_result,
        reason = p_reason, version = version + 1, last_request = p_request, last_actor = p_actor,
        white_ms = case when white_ms is null then null when n % 2 = 0 then greatest(0,white_ms - elapsed) else white_ms end,
        black_ms = case when black_ms is null then null when n % 2 = 1 then greatest(0,black_ms - elapsed) else black_ms end,
        turn_started_at = case when p_status = 'playing' then instant end,
        draw_offer = case when p_status = 'playing' then p_settings->>'draw_offer' end,
        white_can_mate = coalesce((p_settings->>'white_can_mate')::boolean,white_can_mate),
        black_can_mate = coalesce((p_settings->>'black_can_mate')::boolean,black_can_mate)
        where id = room.id returning * into room;
    end if;
  end if;
  if room.id is not null and room.creator_id = p_actor and room.status = 'waiting' then
    select code into invite from chess_private.room_codes where room_id = room.id;
  end if;
  return jsonb_build_object('room', case when room.id is null then null else to_jsonb(room) end, 'code', invite,'server_now',clock_timestamp());
end;
$$;
revoke all on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb) to service_role;

commit;


-- This only adjudicates active clocks. No browser, network tab or user action is required.
select cron.schedule('schacklabbet-settle-clocks','* * * * *',
  $$select chess_private.settle_clock(id) from public.chess_rooms
    where (clock_minutes > 0 or max_minutes > 0) and status = 'playing' and turn_started_at is not null and expires_at > now();$$);
