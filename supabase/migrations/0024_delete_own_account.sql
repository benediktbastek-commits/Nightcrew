-- Self-Service-Accountlöschung. Jede user-bezogene Tabelle referenziert
-- auth.users(id) bereits mit "on delete cascade" (siehe 0001, 0002, 0003, 0004,
-- 0006, 0007, 0008, 0009, 0010, 0011, 0012, 0013, 0014, 0018) — das Löschen des
-- auth-Users reicht deshalb aus, ohne jede Kindtabelle einzeln aufzuzählen.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
