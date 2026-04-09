alter table public.artist_style_options
add column if not exists is_custom boolean not null default false;

alter table public.artist_pricing_rules
add column if not exists size_time_ranges jsonb not null default '{"tiny":{"minHours":0.5,"maxHours":1},"small":{"minHours":1,"maxHours":2},"medium":{"minHours":2,"maxHours":4},"large":{"minHours":4,"maxHours":6}}'::jsonb;

alter table public.artist_featured_designs
add column if not exists price_note text;
