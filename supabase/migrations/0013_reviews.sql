create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewee_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  photo_url text,
  created_at timestamptz not null default now(),
  unique (request_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on public.reviews (reviewee_id);

alter table public.reviews enable row level security;

-- Ratings are a public trust signal (like the open marketplace itself), so anyone
-- authenticated can read them.
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_participant" on public.reviews for insert with check (
  reviewer_id = auth.uid()
  and exists (
    select 1 from public.service_requests r
    where r.id = request_id
      and r.status = 'matched'
      and (r.dj_user_id = auth.uid() or r.matched_photographer_id = auth.uid())
      and reviewee_id in (r.dj_user_id, r.matched_photographer_id)
      and reviewee_id <> auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

create policy "review_photos_select_public" on storage.objects for select using (bucket_id = 'review-photos');
create policy "review_photos_insert_own" on storage.objects for insert with check (
  bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text
);
