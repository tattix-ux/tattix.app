alter table public.artist_style_options
add column if not exists example_image_url text;

alter table public.artist_style_options
add column if not exists example_image_path text;
