alter table public.artist_featured_designs
drop constraint if exists artist_featured_designs_category_check;

alter table public.artist_featured_designs
add constraint artist_featured_designs_category_check
check (char_length(btrim(category)) >= 2);
