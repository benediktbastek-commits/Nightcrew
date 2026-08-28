create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  scope text not null default 'general' check (scope in ('general', 'gig', 'release')),
  gig_id uuid references public.gigs(id) on delete cascade,
  release_id uuid,
  phase_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'spotify')),
  format text not null check (format in ('reel', 'carousel', 'story', 'video')),
  caption text,
  planned_at timestamptz,
  published_at timestamptz,
  status text not null default 'idea' check (status in ('idea', 'draft', 'in_progress', 'ready', 'published')),
  release_id uuid,
  gig_id uuid references public.gigs(id) on delete set null,
  media_url text,
  external_url text,
  external_id text,
  ai_generated boolean not null default false,
  source_plan_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_done_idx on public.tasks (user_id, done);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_date);
create index if not exists posts_user_planned_idx on public.posts (user_id, planned_at);

alter table public.tasks enable row level security;
alter table public.posts enable row level security;

create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

create policy "posts_select_own" on public.posts for select using (auth.uid() = user_id);
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = user_id);
