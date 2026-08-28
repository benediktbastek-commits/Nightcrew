alter table public.service_requests
  add column if not exists target_photographer_id uuid references auth.users(id) on delete set null;

drop policy if exists "service_requests_select" on public.service_requests;
create policy "service_requests_select" on public.service_requests for select using (
  (status = 'open' and target_photographer_id is null)
  or dj_user_id = auth.uid()
  or matched_photographer_id = auth.uid()
  or target_photographer_id = auth.uid()
);

create table if not exists public.photographer_availability (
  id uuid primary key default gen_random_uuid(),
  photographer_user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  start_time text not null,
  end_time text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create index if not exists photographer_availability_date_idx on public.photographer_availability (date);

alter table public.photographer_availability enable row level security;

create policy "photographer_availability_select_all" on public.photographer_availability for select using (true);
create policy "photographer_availability_insert_own" on public.photographer_availability for insert with check (photographer_user_id = auth.uid());
create policy "photographer_availability_delete_own" on public.photographer_availability for delete using (photographer_user_id = auth.uid());
