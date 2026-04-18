alter table public.artist_page_themes
add column if not exists text_color text not null default '#f3eee6';

