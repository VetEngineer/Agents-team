do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'users'
  ) then
    alter table public.users
      add column if not exists name text,
      add column if not exists phone text,
      add column if not exists role text default 'owner',
      add column if not exists created_at timestamptz default now();
  end if;
exception
  when others then
    raise notice 'preflight users migration skipped: %', sqlerrm;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'role'
  ) then
    begin
      alter table public.users
        add constraint users_role_check
        check (role in ('owner','agency','admin'));
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
