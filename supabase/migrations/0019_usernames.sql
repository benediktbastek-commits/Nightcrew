-- Eindeutiger, Instagram-artiger Benutzername (zusätzlich zum freien Anzeigenamen).
-- Nullable, damit bestehende Profile nicht sofort brechen — Middleware schickt Nutzer
-- ohne username zurück zum Onboarding, wo er verpflichtend gesetzt wird.
alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;
