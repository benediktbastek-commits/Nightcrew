-- LinkedIn-artige Verbindungen zwischen beliebigen Usern (rollenoffen — nicht an
-- den DJ<->Fotograf-Marktplatz gebunden, das ist ein eigener, allgemeiner Layer).
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint connections_no_self check (requester_id <> recipient_id)
);

-- Nur eine Verbindung pro Personenpaar, unabhängig davon wer wen zuerst angefragt hat.
create unique index if not exists connections_pair_idx on public.connections (
  least(requester_id, recipient_id), greatest(requester_id, recipient_id)
);

create index if not exists connections_recipient_idx on public.connections (recipient_id, status);
create index if not exists connections_requester_idx on public.connections (requester_id, status);

alter table public.connections enable row level security;

create policy "connections_select_participant" on public.connections for select using (
  auth.uid() = requester_id or auth.uid() = recipient_id
);
create policy "connections_insert_own" on public.connections for insert with check (
  auth.uid() = requester_id
);
create policy "connections_update_recipient" on public.connections for update using (
  auth.uid() = recipient_id
) with check (
  auth.uid() = recipient_id
);
create policy "connections_delete_participant" on public.connections for delete using (
  auth.uid() = requester_id or auth.uid() = recipient_id
);

-- Direkter 1:1-Chat, erst freigeschaltet sobald eine Verbindung 'accepted' ist.
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists direct_messages_connection_idx on public.direct_messages (connection_id, created_at);

alter table public.direct_messages enable row level security;

create policy "direct_messages_select_participant" on public.direct_messages for select using (
  exists (
    select 1 from public.connections c
    where c.id = connection_id
      and c.status = 'accepted'
      and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
  )
);
create policy "direct_messages_insert_participant" on public.direct_messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.connections c
    where c.id = connection_id
      and c.status = 'accepted'
      and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
  )
);
