alter table public.artist_style_options
add column if not exists style_description text;

alter table public.artist_style_options
add column if not exists deleted boolean not null default false;
