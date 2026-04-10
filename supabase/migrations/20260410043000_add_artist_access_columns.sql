alter table public.artists
add column if not exists plan_type text not null default 'free',
add column if not exists access_status text not null default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artists_plan_type_check'
  ) then
    alter table public.artists
    add constraint artists_plan_type_check
    check (plan_type in ('free', 'pro'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artists_access_status_check'
  ) then
    alter table public.artists
    add constraint artists_access_status_check
    check (access_status in ('active', 'pending', 'blocked'));
  end if;
end
$$;
