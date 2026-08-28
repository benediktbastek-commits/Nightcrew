alter table public.account_metrics
  add column if not exists likes integer,
  add column if not exists comments integer,
  add column if not exists reposts integer,
  add column if not exists shares integer,
  add column if not exists saves integer;
