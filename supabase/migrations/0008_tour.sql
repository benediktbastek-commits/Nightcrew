create table if not exists public.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  time text not null,
  title text not null,
  detail text,
  done boolean not null default false,
  sort_order integer not null default 0
);

create index if not exists itinerary_stops_gig_idx on public.itinerary_stops (gig_id, sort_order);

alter table public.itinerary_stops enable row level security;

create policy "itinerary_stops_select_own" on public.itinerary_stops for select using (
  exists (select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid())
);
create policy "itinerary_stops_insert_own" on public.itinerary_stops for insert with check (
  exists (select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid())
);
create policy "itinerary_stops_update_own" on public.itinerary_stops for update using (
  exists (select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid())
);
create policy "itinerary_stops_delete_own" on public.itinerary_stops for delete using (
  exists (select 1 from public.gigs g where g.id = gig_id and g.user_id = auth.uid())
);
