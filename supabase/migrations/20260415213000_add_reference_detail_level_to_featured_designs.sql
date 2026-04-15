alter table public.artist_featured_designs
add column if not exists reference_detail_level text;
