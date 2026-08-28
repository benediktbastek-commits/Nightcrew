-- Fotografen können optional die Content-Planung (wie bei DJs) dazuschalten.
alter table public.profiles add column if not exists wants_content boolean not null default false;
