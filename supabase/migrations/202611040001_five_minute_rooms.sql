-- Permit a shorter player clock without changing existing games or clock rules.
begin;

alter table public.chess_rooms drop constraint chess_rooms_clock_minutes_check;
alter table public.chess_rooms add constraint chess_rooms_clock_minutes_check
  check (clock_minutes in (0,5,10,15));

-- Preserve the installed RPC, permissions and all atomic clock/move handling.
-- Fail safely if its validation no longer matches the expected clock contract.
do $$
declare
  definition text := pg_get_functiondef(
    'public.chess_room_command(uuid,text,uuid,text,text,integer,jsonb,text,text,text,uuid,jsonb)'::regprocedure
  );
begin
  if position('not in (0,10,15)' in definition) > 0 then
    execute replace(definition, 'not in (0,10,15)', 'not in (0,5,10,15)');
  elsif position('not in (0,5,10,15)' in definition) = 0 then
    raise exception 'Unexpected chess_room_command clock validation; upgrade aborted';
  end if;
end;
$$;

commit;
