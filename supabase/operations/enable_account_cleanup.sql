-- Run ONLY after the owner has explicitly approved irreversible account cleanup.
-- Review eligibility first: select chess_private.cleanup_inactive_players();
-- Migration 202611040002 must already be installed; pg_cron already serves game expiry.
select cron.schedule(
  'schacklabbet-inactive-players', '41 2 * * *',
  $job$select chess_private.cleanup_inactive_players(false);$job$
);
