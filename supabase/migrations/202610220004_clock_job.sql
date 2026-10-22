-- This only adjudicates active clocks. No browser, network tab or user action is required.
select cron.schedule('schacklabbet-settle-clocks','* * * * *',
  $$select chess_private.settle_clock(id) from public.chess_rooms
    where (clock_minutes > 0 or max_minutes > 0) and status = 'playing' and turn_started_at is not null and expires_at > now();$$);
