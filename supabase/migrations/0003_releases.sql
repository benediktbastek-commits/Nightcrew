create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'ep' check (kind in ('ep', 'single', 'album', 'remix')),
  label text,
  release_date date not null,
  campaign_start date not null,
  status text not null default 'planning' check (status in ('planning', 'scheduled', 'released')),
  budget_cents integer not null default 0,
  presave_count integer not null default 0,
  presave_goal integer not null default 0,
  artwork_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.release_phases (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  no integer not null,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  sort_order integer not null default 0
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  side_label text not null,
  title text not null,
  duration_seconds integer,
  status text not null default 'open' check (status in ('master', 'revision', 'open')),
  sort_order integer not null default 0
);

create table if not exists public.release_assets (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  name text not null,
  done boolean not null default false,
  done_on date
);

create table if not exists public.release_deadlines (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases(id) on delete cascade,
  title text not null,
  due_date date not null,
  owner_contact_id uuid references public.contacts(id) on delete set null,
  done boolean not null default false
);

create index if not exists release_phases_release_idx on public.release_phases (release_id, sort_order);
create index if not exists tracks_release_idx on public.tracks (release_id, sort_order);
create index if not exists release_assets_release_idx on public.release_assets (release_id);
create index if not exists release_deadlines_release_idx on public.release_deadlines (release_id, due_date);

alter table public.releases enable row level security;
alter table public.release_phases enable row level security;
alter table public.tracks enable row level security;
alter table public.release_assets enable row level security;
alter table public.release_deadlines enable row level security;

create policy "releases_select_own" on public.releases for select using (auth.uid() = user_id);
create policy "releases_insert_own" on public.releases for insert with check (auth.uid() = user_id);
create policy "releases_update_own" on public.releases for update using (auth.uid() = user_id);
create policy "releases_delete_own" on public.releases for delete using (auth.uid() = user_id);

create policy "release_phases_select_own" on public.release_phases for select using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_phases_insert_own" on public.release_phases for insert with check (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_phases_update_own" on public.release_phases for update using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_phases_delete_own" on public.release_phases for delete using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);

create policy "tracks_select_own" on public.tracks for select using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "tracks_insert_own" on public.tracks for insert with check (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "tracks_update_own" on public.tracks for update using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "tracks_delete_own" on public.tracks for delete using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);

create policy "release_assets_select_own" on public.release_assets for select using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_assets_insert_own" on public.release_assets for insert with check (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_assets_update_own" on public.release_assets for update using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_assets_delete_own" on public.release_assets for delete using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);

create policy "release_deadlines_select_own" on public.release_deadlines for select using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_deadlines_insert_own" on public.release_deadlines for insert with check (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_deadlines_update_own" on public.release_deadlines for update using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);
create policy "release_deadlines_delete_own" on public.release_deadlines for delete using (
  exists (select 1 from public.releases r where r.id = release_id and r.user_id = auth.uid())
);

alter table public.tasks add constraint tasks_release_id_fkey foreign key (release_id) references public.releases(id) on delete cascade;
alter table public.tasks add constraint tasks_phase_id_fkey foreign key (phase_id) references public.release_phases(id) on delete cascade;
alter table public.posts add constraint posts_release_id_fkey foreign key (release_id) references public.releases(id) on delete set null;
