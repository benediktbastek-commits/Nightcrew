-- Snapshot of a platform's previous metric values, taken right before a re-import
-- overwrites the row, so the Analytics screen can show a month-over-month trend.
alter table public.account_metrics add column if not exists previous jsonb;
