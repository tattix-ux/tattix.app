alter table public.client_submissions
add column if not exists preferred_start_date date,
add column if not exists preferred_end_date date;
