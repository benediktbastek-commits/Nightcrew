create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_request_idx on public.messages (request_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_participant" on public.messages for select using (
  exists (
    select 1 from public.service_requests r
    where r.id = request_id
      and (r.dj_user_id = auth.uid() or r.matched_photographer_id = auth.uid())
  )
);
create policy "messages_insert_participant" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.service_requests r
    where r.id = request_id
      and r.status = 'matched'
      and (r.dj_user_id = auth.uid() or r.matched_photographer_id = auth.uid())
  )
);
