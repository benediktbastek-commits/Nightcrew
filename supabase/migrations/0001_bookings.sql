create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  organisation text,
  role text not null default 'booking' check (role in ('booking', 'label_promo', 'crew')),
  email text,
  phone text,
  last_contact_at date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  venue text not null,
  city text not null,
  date date not null,
  set_start time,
  set_end time,
  fee_cents integer not null default 0,
  currency text not null default 'EUR',
  status text not null default 'requested' check (status in ('confirmed', 'requested', 'option')),
  contact_id uuid references public.contacts(id) on delete set null,
  tech_notes text,
  hotel text,
  travel text,
  advance_confirmed boolean not null default false,
  rider_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gigs_user_date_idx on public.gigs (user_id, date);
create index if not exists contacts_user_name_idx on public.contacts (user_id, name);

alter table public.contacts enable row level security;
alter table public.gigs enable row level security;

create policy "contacts_select_own" on public.contacts for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.contacts for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.contacts for update using (auth.uid() = user_id);
create policy "contacts_delete_own" on public.contacts for delete using (auth.uid() = user_id);

create policy "gigs_select_own" on public.gigs for select using (auth.uid() = user_id);
create policy "gigs_insert_own" on public.gigs for insert with check (auth.uid() = user_id);
create policy "gigs_update_own" on public.gigs for update using (auth.uid() = user_id);
create policy "gigs_delete_own" on public.gigs for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists gigs_set_updated_at on public.gigs;
create trigger gigs_set_updated_at
before update on public.gigs
for each row execute function public.set_updated_at();
