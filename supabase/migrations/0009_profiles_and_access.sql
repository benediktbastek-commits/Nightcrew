create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  status text,
  roles text[] not null default '{}',
  ai_unlocked boolean not null default false,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  created_by uuid not null references auth.users(id) on delete cascade,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.access_codes enable row level security;

create policy "access_codes_select_own" on public.access_codes for select using (auth.uid() = created_by);
create policy "access_codes_select_available" on public.access_codes for select using (redeemed_by is null and revoked = false);
create policy "access_codes_select_redeemed_by_self" on public.access_codes for select using (redeemed_by = auth.uid());
create policy "access_codes_insert_own" on public.access_codes for insert with check (auth.uid() = created_by);
create policy "access_codes_update_own" on public.access_codes for update using (auth.uid() = created_by);
create policy "access_codes_redeem" on public.access_codes for update using (redeemed_by is null and revoked = false) with check (redeemed_by = auth.uid());

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;
create policy "feedback_select_own" on public.feedback for select using (auth.uid() = user_id);
create policy "feedback_insert_own" on public.feedback for insert with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_select_public" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_insert_own" on storage.objects for insert with check (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "avatars_update_own" on storage.objects for update using (
  bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
