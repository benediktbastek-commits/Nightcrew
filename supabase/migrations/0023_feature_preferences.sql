-- Lässt jede Person selbst wählen, welche Module sie sehen möchte (Bookings,
-- Content, Releases, Analytics, Finanzen, Tour, Marktplatz, Netzwerk, Crew AI).
-- Alles defaultet auf true, damit sich für bestehende Accounts nichts ändert,
-- bis sie aktiv etwas abwählen.
alter table public.profiles
  add column if not exists wants_bookings boolean not null default true,
  add column if not exists wants_releases boolean not null default true,
  add column if not exists wants_analytics boolean not null default true,
  add column if not exists wants_finance boolean not null default true,
  add column if not exists wants_tour boolean not null default true,
  add column if not exists wants_marketplace boolean not null default true,
  add column if not exists wants_network boolean not null default true,
  add column if not exists wants_crew_ai boolean not null default true;

-- wants_content existierte bisher nur für Fotograf:innen (default false, Opt-in).
-- DJs hatten dafür nie einen Schalter und haben Content immer gesehen — das
-- bleibt für bestehende DJ-Accounts erhalten, jetzt wo der Schalter für alle gilt.
update public.profiles set wants_content = true
where 'dj_producer' = any(roles) and wants_content = false;
