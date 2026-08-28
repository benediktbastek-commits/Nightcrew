create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- Inserts happen from server actions acting on behalf of the OTHER party in a
-- connection (e.g. a photographer's offer notifies the DJ), so a plain
-- "auth.uid() = user_id" insert policy would block them. Same reasoning as
-- accept_service_offer in migration 0010: authorize via a SECURITY DEFINER function
-- instead of relying on row-level insert checks.
create or replace function public.notify_user(target_user_id uuid, message text, link text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, message, link) values (target_user_id, message, link);
end;
$$;

grant execute on function public.notify_user(uuid, text, text) to authenticated;
