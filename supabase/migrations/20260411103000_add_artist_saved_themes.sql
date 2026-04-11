create table if not exists public.artist_saved_themes (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  name text not null,
  theme_snapshot jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.artist_saved_themes enable row level security;

create policy "Artists own saved themes"
on public.artist_saved_themes
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_saved_themes.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_saved_themes.artist_id
      and artists.user_id = auth.uid()
  )
);
