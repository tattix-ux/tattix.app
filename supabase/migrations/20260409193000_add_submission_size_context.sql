alter table public.client_submissions
add column if not exists size_mode text;

alter table public.client_submissions
add column if not exists approximate_size_cm numeric(6,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_submissions_size_mode_check'
  ) then
    alter table public.client_submissions
    add constraint client_submissions_size_mode_check
    check (size_mode in ('quick', 'visual') or size_mode is null);
  end if;
end $$;
