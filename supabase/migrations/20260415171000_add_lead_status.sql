alter table public.client_submissions
add column if not exists status text;

update public.client_submissions
set status = case
  when converted_to_sale = true then 'sold'
  when contacted = true then 'contacted'
  else 'new'
end
where status is null;

update public.client_submissions
set status = 'new'
where status not in ('new', 'contacted', 'sold', 'lost');

alter table public.client_submissions
alter column status set default 'new';

alter table public.client_submissions
alter column status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_submissions_status_check'
  ) then
    alter table public.client_submissions
    add constraint client_submissions_status_check
    check (status in ('new', 'contacted', 'sold', 'lost'));
  end if;
end $$;
