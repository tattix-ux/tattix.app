alter table if exists public.client_submissions
  alter column estimated_min drop not null,
  alter column estimated_max drop not null;
