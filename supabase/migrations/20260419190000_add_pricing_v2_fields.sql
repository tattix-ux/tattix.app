alter table if exists public.artist_pricing_rules
  add column if not exists pricing_version text;

alter table if exists public.artist_featured_designs
  add column if not exists reference_size_cm numeric,
  add column if not exists reference_color_mode text,
  add column if not exists pricing_mode text,
  add column if not exists color_impact_preference text;

alter table if exists public.client_submissions
  add column if not exists pricing_version text,
  add column if not exists pricing_source text,
  add column if not exists request_type text,
  add column if not exists estimate_mode text,
  add column if not exists featured_design_pricing_mode text,
  add column if not exists display_estimate_label text;
