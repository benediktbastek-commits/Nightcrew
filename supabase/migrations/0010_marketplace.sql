alter table public.profiles
  add column if not exists skills text[] not null default '{}',
  add column if not exists portfolio jsonb not null default '[]';

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  dj_user_id uuid not null references auth.users(id) on delete cascade,
  gig_id uuid references public.gigs(id) on delete set null,
  location text not null,
  date date not null,
  service_type text not null check (service_type in ('photo', 'video', 'both')),
  notes text,
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  matched_photographer_id uuid references auth.users(id) on delete set null,
  matched_gig_id uuid references public.gigs(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.service_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  photographer_user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists service_requests_status_idx on public.service_requests (status, date);
create index if not exists service_offers_request_idx on public.service_offers (request_id);

alter table public.service_requests enable row level security;
alter table public.service_offers enable row level security;

create policy "service_requests_select" on public.service_requests for select using (
  status = 'open' or dj_user_id = auth.uid() or matched_photographer_id = auth.uid()
);
create policy "service_requests_insert_own" on public.service_requests for insert with check (dj_user_id = auth.uid());
create policy "service_requests_update_own" on public.service_requests for update using (dj_user_id = auth.uid());
create policy "service_requests_delete_own" on public.service_requests for delete using (dj_user_id = auth.uid());

create policy "service_offers_select" on public.service_offers for select using (
  photographer_user_id = auth.uid()
  or exists (select 1 from public.service_requests r where r.id = request_id and r.dj_user_id = auth.uid())
);
create policy "service_offers_insert_own" on public.service_offers for insert with check (photographer_user_id = auth.uid());
create policy "service_offers_update_by_dj" on public.service_offers for update using (
  exists (select 1 from public.service_requests r where r.id = request_id and r.dj_user_id = auth.uid())
);

-- Accepting an offer creates a booking for the photographer (a different user than the
-- caller), which normal RLS on gigs would block — this runs as SECURITY DEFINER and
-- checks authorization itself instead of relying on table-level RLS.
create or replace function public.accept_service_offer(offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.service_requests%rowtype;
  v_offer public.service_offers%rowtype;
  v_new_gig_id uuid;
  v_venue text;
  v_city text;
begin
  select * into v_offer from public.service_offers where id = offer_id;
  if v_offer is null then
    raise exception 'offer not found';
  end if;

  select * into v_request from public.service_requests where id = v_offer.request_id;
  if v_request is null then
    raise exception 'request not found';
  end if;

  if v_request.dj_user_id <> auth.uid() then
    raise exception 'not authorized';
  end if;

  if v_request.status <> 'open' then
    raise exception 'request already matched';
  end if;

  if v_request.gig_id is not null then
    select venue, city into v_venue, v_city from public.gigs where id = v_request.gig_id;
  end if;

  insert into public.gigs (user_id, venue, city, date, fee_cents, status, tech_notes)
  values (
    v_offer.photographer_user_id,
    coalesce(v_venue, v_request.location),
    coalesce(v_city, v_request.location),
    v_request.date,
    0,
    'confirmed',
    v_request.notes
  )
  returning id into v_new_gig_id;

  update public.service_offers set status = 'accepted' where id = offer_id;
  update public.service_offers set status = 'declined' where request_id = v_request.id and id <> offer_id and status = 'pending';
  update public.service_requests
    set status = 'matched', matched_photographer_id = v_offer.photographer_user_id, matched_gig_id = v_new_gig_id
    where id = v_request.id;

  return v_new_gig_id;
end;
$$;

grant execute on function public.accept_service_offer(uuid) to authenticated;
