alter table if exists public.client_submissions
  add column if not exists area_scope text,
  add column if not exists large_area_coverage text,
  add column if not exists wide_area_target text,
  add column if not exists cover_up boolean;
