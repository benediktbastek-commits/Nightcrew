-- Profil-Felder für die öffentliche Ansicht im Marktplatz (Bio, Standort, Socials).
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists socials jsonb;

-- Bisher durfte jeder nur sein eigenes Profil lesen. Für die Profilansicht im
-- Marktplatz müssen eingeloggte User auch andere Profile sehen können.
create policy "profiles_select_authenticated" on public.profiles for select using (auth.role() = 'authenticated');
