alter table public.client_submissions
add column if not exists converted_to_sale boolean not null default false,
add column if not exists sold_at timestamptz;
