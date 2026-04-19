alter table if exists public.client_submissions
  add column if not exists customer_gender text,
  add column if not exists customer_age_range text;
