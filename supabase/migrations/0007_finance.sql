create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  gig_id uuid references public.gigs(id) on delete set null,
  recipient text not null,
  amount_cents integer not null default 0,
  issued_on date not null,
  due_on date,
  paid_on date,
  status text not null default 'draft' check (status in ('draft', 'open', 'paid', 'overdue')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  amount_cents integer not null default 0,
  date date not null,
  note text,
  gig_id uuid references public.gigs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists invoices_user_status_idx on public.invoices (user_id, status);
create index if not exists expenses_user_date_idx on public.expenses (user_id, date);

alter table public.invoices enable row level security;
alter table public.expenses enable row level security;

create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id);
create policy "invoices_insert_own" on public.invoices for insert with check (auth.uid() = user_id);
create policy "invoices_update_own" on public.invoices for update using (auth.uid() = user_id);
create policy "invoices_delete_own" on public.invoices for delete using (auth.uid() = user_id);

create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);
