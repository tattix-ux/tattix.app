create table if not exists public.artist_booking_locations (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  city_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (artist_id, city_name)
);

create trigger artist_booking_locations_set_updated_at
before update on public.artist_booking_locations
for each row
execute function public.set_updated_at();

create table if not exists public.artist_booking_location_dates (
  id uuid primary key default gen_random_uuid(),
  artist_location_id uuid not null references public.artist_booking_locations (id) on delete cascade,
  available_date date not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (artist_location_id, available_date)
);

alter table public.artist_booking_locations enable row level security;
alter table public.artist_booking_location_dates enable row level security;

create policy "Public can read active booking locations"
on public.artist_booking_locations
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_booking_locations.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own booking locations"
on public.artist_booking_locations
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_booking_locations.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_booking_locations.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can read active booking dates"
on public.artist_booking_location_dates
for select
using (
  exists (
    select 1
    from public.artist_booking_locations
    join public.artists on artists.id = artist_booking_locations.artist_id
    where artist_booking_locations.id = artist_booking_location_dates.artist_location_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own booking dates"
on public.artist_booking_location_dates
for all
using (
  exists (
    select 1
    from public.artist_booking_locations
    join public.artists on artists.id = artist_booking_locations.artist_id
    where artist_booking_locations.id = artist_booking_location_dates.artist_location_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artist_booking_locations
    join public.artists on artists.id = artist_booking_locations.artist_id
    where artist_booking_locations.id = artist_booking_location_dates.artist_location_id
      and artists.user_id = auth.uid()
  )
);
