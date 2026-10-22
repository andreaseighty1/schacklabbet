-- Expired games and invite codes are removed hourly; unrelated data is untouched.
create extension if not exists pg_cron;
select cron.schedule(
  'schacklabbet-expired-rooms', '13 * * * *',
  $job$
    delete from public.chess_rooms where expires_at < now();
    delete from chess_private.request_limits where bucket < now() - interval '2 days';
  $job$
);
