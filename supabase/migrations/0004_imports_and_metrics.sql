create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'spotify')),
  kind text not null check (kind in ('account', 'post')),
  image_path text not null,
  raw_extraction jsonb,
  confidence jsonb,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.account_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'spotify')),
  period_start date not null,
  period_end date not null,
  views integer,
  reach integer,
  profile_views integer,
  followers_delta integer,
  interactions integer,
  source text not null default 'screenshot' check (source in ('screenshot', 'manual', 'api')),
  import_id uuid references public.imports(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  measured_at timestamptz not null default now(),
  views integer,
  likes integer,
  saves integer,
  shares integer,
  followers_delta integer,
  avg_watch_seconds numeric,
  completion_rate numeric,
  retention_curve jsonb,
  source text not null default 'screenshot' check (source in ('screenshot', 'manual', 'api')),
  import_id uuid references public.imports(id) on delete set null
);

create index if not exists imports_user_created_idx on public.imports (user_id, created_at desc);
create index if not exists account_metrics_user_period_idx on public.account_metrics (user_id, platform, period_start);
create index if not exists post_metrics_post_idx on public.post_metrics (post_id, measured_at);

alter table public.imports enable row level security;
alter table public.account_metrics enable row level security;
alter table public.post_metrics enable row level security;

create policy "imports_select_own" on public.imports for select using (auth.uid() = user_id);
create policy "imports_insert_own" on public.imports for insert with check (auth.uid() = user_id);
create policy "imports_update_own" on public.imports for update using (auth.uid() = user_id);
create policy "imports_delete_own" on public.imports for delete using (auth.uid() = user_id);

create policy "account_metrics_select_own" on public.account_metrics for select using (auth.uid() = user_id);
create policy "account_metrics_insert_own" on public.account_metrics for insert with check (auth.uid() = user_id);
create policy "account_metrics_update_own" on public.account_metrics for update using (auth.uid() = user_id);
create policy "account_metrics_delete_own" on public.account_metrics for delete using (auth.uid() = user_id);

create policy "post_metrics_select_own" on public.post_metrics for select using (
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);
create policy "post_metrics_insert_own" on public.post_metrics for insert with check (
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);
create policy "post_metrics_update_own" on public.post_metrics for update using (
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);
create policy "post_metrics_delete_own" on public.post_metrics for delete using (
  exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('imports', 'imports', false)
on conflict (id) do nothing;

create policy "imports_storage_select_own" on storage.objects for select using (
  bucket_id = 'imports' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "imports_storage_insert_own" on storage.objects for insert with check (
  bucket_id = 'imports' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "imports_storage_delete_own" on storage.objects for delete using (
  bucket_id = 'imports' and (storage.foldername(name))[1] = auth.uid()::text
);
