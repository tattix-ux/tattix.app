alter table public.client_submissions
  add column if not exists color_mode text,
  add column if not exists realism_level text,
  add column if not exists layout_style text;
