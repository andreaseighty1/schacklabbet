-- Run ONLY after the owner has explicitly approved irreversible account cleanup.
-- Review eligibility first: select chess_private.cleanup_inactive_players();
-- Migrations 202611040002 and 202611040003 must be installed; pg_cron already serves game expiry.
select cron.schedule(
  'schacklabbet-inactive-players', '41 2 * * *',
  $job$select chess_private.cleanup_inactive_players(false);$job$
);
