-- Auth may update or convert an account without taking the game's advisory lock.
-- Lock its Auth row before the final eligibility snapshot as well.
begin;
create or replace function chess_private.cleanup_inactive_players(p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare candidate uuid; removed integer:=0; matched integer; affected integer;
begin
  select count(*) into matched from chess_private.inactive_players();
  if p_dry_run is distinct from false then
    return jsonb_build_object('eligible',matched,'deleted',0,'dry_run',true);
  end if;
  for candidate in select * from chess_private.inactive_players() limit 100 loop
    if pg_try_advisory_xact_lock(hashtextextended(candidate::text,0)) then
      perform id from auth.users where id=candidate for update;
      -- Direct predicates also protect against a concurrent Auth row change.
      delete from auth.users u where u.id=candidate
        and u.is_anonymous is true and coalesce(u.email,'')='' and coalesce(u.phone,'')=''
        and u.created_at<now()-interval '30 days'
        and coalesce(u.last_sign_in_at,u.created_at)<now()-interval '30 days'
        and exists(select 1 from chess_private.player_activity a
          where a.actor=u.id and a.last_seen_at<now()-interval '30 days')
        and not exists(select 1 from public.chess_rooms r
          where (r.creator_id=u.id or r.white_id=u.id or r.black_id=u.id)
            and r.status in ('waiting','playing') and r.expires_at>now());
      get diagnostics affected=row_count;
      removed:=removed+affected;
    end if;
  end loop;
  return jsonb_build_object('eligible',matched,'deleted',removed,'dry_run',false);
end;
$$;
revoke all on function chess_private.cleanup_inactive_players(boolean) from public,anon,authenticated,service_role;
commit;
