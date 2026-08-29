-- Erlaubt dem Owner, KI-Zugang direkt per E-Mail freizuschalten/zu entziehen, ohne
-- Umweg über Zugangscodes. Braucht SECURITY DEFINER, weil E-Mails in auth.users
-- liegen, das normale Clients nicht direkt abfragen dürfen.
create or replace function public.set_ai_access(target_email text, unlocked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not exists (
    select 1 from auth.users where id = auth.uid() and lower(email) = 'benedikt.bastek@gmx.de'
  ) then
    raise exception 'not_authorized';
  end if;

  select id into target_id from auth.users where lower(email) = lower(target_email);
  if target_id is null then
    raise exception 'user_not_found';
  end if;

  insert into public.profiles (id, ai_unlocked)
  values (target_id, unlocked)
  on conflict (id) do update set ai_unlocked = excluded.ai_unlocked;
end;
$$;

grant execute on function public.set_ai_access(text, boolean) to authenticated;

-- Für den Entzug aus der Liste der bereits freigeschalteten Accounts (dort liegt
-- nur die profile-id vor, keine E-Mail).
create or replace function public.set_ai_access_by_id(target_id uuid, unlocked boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from auth.users where id = auth.uid() and lower(email) = 'benedikt.bastek@gmx.de'
  ) then
    raise exception 'not_authorized';
  end if;

  insert into public.profiles (id, ai_unlocked)
  values (target_id, unlocked)
  on conflict (id) do update set ai_unlocked = excluded.ai_unlocked;
end;
$$;

grant execute on function public.set_ai_access_by_id(uuid, boolean) to authenticated;
