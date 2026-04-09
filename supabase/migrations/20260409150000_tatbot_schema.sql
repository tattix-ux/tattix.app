create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  artist_name text not null,
  slug text not null unique,
  profile_image_url text,
  cover_image_url text,
  short_bio text not null default '',
  welcome_headline text not null default '',
  whatsapp_number text not null default '',
  instagram_handle text not null default '',
  currency text not null default 'TRY' check (currency in ('TRY', 'EUR', 'USD')),
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger artists_set_updated_at
before update on public.artists
for each row
execute function public.set_updated_at();

create table if not exists public.artist_funnel_settings (
  artist_id uuid primary key references public.artists (id) on delete cascade,
  intro_eyebrow text not null default 'TatBot intake',
  intro_title text not null default 'Tell us the placement, size, and style.',
  intro_description text not null default 'A fast mobile-first intake flow for tattoo inquiries.',
  show_featured_designs boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger artist_funnel_settings_set_updated_at
before update on public.artist_funnel_settings
for each row
execute function public.set_updated_at();

create table if not exists public.artist_style_options (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  style_key text not null,
  label text not null,
  enabled boolean not null default true,
  multiplier numeric(5, 2) not null default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (artist_id, style_key)
);

create trigger artist_style_options_set_updated_at
before update on public.artist_style_options
for each row
execute function public.set_updated_at();

create table if not exists public.artist_featured_designs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  category text not null check (category in ('discounted-designs', 'wanna-do-designs', 'flash-designs')),
  title text not null,
  short_description text not null default '',
  image_url text,
  reference_price_min integer,
  reference_price_max integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger artist_featured_designs_set_updated_at
before update on public.artist_featured_designs
for each row
execute function public.set_updated_at();

create table if not exists public.artist_pricing_rules (
  artist_id uuid primary key references public.artists (id) on delete cascade,
  minimum_session_price integer not null default 0,
  size_base_ranges jsonb not null default '{"tiny":{"min":1000,"max":1800},"small":{"min":1500,"max":2500},"medium":{"min":3000,"max":5000},"large":{"min":6000,"max":9000}}'::jsonb,
  placement_multipliers jsonb not null default '{}'::jsonb,
  intent_multipliers jsonb not null default '{"custom-tattoo":1,"design-in-mind":1,"flash-design":0.95,"discounted-design":0.85,"not-sure":1}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger artist_pricing_rules_set_updated_at
before update on public.artist_pricing_rules
for each row
execute function public.set_updated_at();

create table if not exists public.artist_page_themes (
  artist_id uuid primary key references public.artists (id) on delete cascade,
  preset_theme text not null default 'dark-minimal',
  background_type text not null default 'solid' check (background_type in ('solid', 'gradient', 'image')),
  background_color text not null default '#09090b',
  gradient_start text not null default '#111114',
  gradient_end text not null default '#09090b',
  background_image_url text,
  primary_color text not null default '#f7b15d',
  secondary_color text not null default '#2b2c31',
  card_color text not null default '#131316',
  card_opacity numeric(3, 2) not null default 0.78,
  heading_font text not null default 'display-serif',
  body_font text not null default 'clean-sans',
  font_pairing_preset text not null default 'premium-editorial',
  radius_style text not null default 'large' check (radius_style in ('small', 'medium', 'large')),
  theme_mode text not null default 'dark' check (theme_mode in ('dark', 'light')),
  custom_welcome_title text,
  custom_intro_text text,
  custom_cta_label text,
  featured_section_label_1 text,
  featured_section_label_2 text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger artist_page_themes_set_updated_at
before update on public.artist_page_themes
for each row
execute function public.set_updated_at();

create table if not exists public.client_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  intent text not null,
  body_area_group text not null,
  body_area_detail text not null,
  size_category text not null check (size_category in ('tiny', 'small', 'medium', 'large')),
  width_cm numeric(6, 2),
  height_cm numeric(6, 2),
  style text not null,
  notes text,
  estimated_min integer not null,
  estimated_max integer not null,
  contact_message text not null,
  contacted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.artists enable row level security;
alter table public.artist_funnel_settings enable row level security;
alter table public.artist_style_options enable row level security;
alter table public.artist_featured_designs enable row level security;
alter table public.artist_pricing_rules enable row level security;
alter table public.artist_page_themes enable row level security;
alter table public.client_submissions enable row level security;

create policy "Artists are publicly readable when active"
on public.artists
for select
using (active = true or auth.uid() = user_id);

create policy "Artists can insert their own row"
on public.artists
for insert
with check (auth.uid() = user_id);

create policy "Artists can update their own row"
on public.artists
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Artists can delete their own row"
on public.artists
for delete
using (auth.uid() = user_id);

create policy "Public can read active funnel settings"
on public.artist_funnel_settings
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_funnel_settings.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own funnel settings"
on public.artist_funnel_settings
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_funnel_settings.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_funnel_settings.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can read active style options"
on public.artist_style_options
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_style_options.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own style options"
on public.artist_style_options
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_style_options.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_style_options.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can read active featured designs"
on public.artist_featured_designs
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_featured_designs.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own featured designs"
on public.artist_featured_designs
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_featured_designs.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_featured_designs.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can read active pricing rules"
on public.artist_pricing_rules
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_pricing_rules.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own pricing rules"
on public.artist_pricing_rules
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_pricing_rules.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_pricing_rules.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can read active page themes"
on public.artist_page_themes
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_page_themes.artist_id
      and (artists.active = true or artists.user_id = auth.uid())
  )
);

create policy "Artists own page themes"
on public.artist_page_themes
for all
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_page_themes.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_page_themes.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Artists can read their own submissions"
on public.client_submissions
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = client_submissions.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Artists can update their own submissions"
on public.client_submissions
for update
using (
  exists (
    select 1
    from public.artists
    where artists.id = client_submissions.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = client_submissions.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Public can submit to active artists"
on public.client_submissions
for insert
with check (
  exists (
    select 1
    from public.artists
    where artists.id = client_submissions.artist_id
      and artists.active = true
  )
);

insert into storage.buckets (id, name, public)
values ('artist-assets', 'artist-assets', true)
on conflict (id) do nothing;

create policy "Public can read artist assets"
on storage.objects
for select
using (bucket_id = 'artist-assets');

create policy "Artists can upload artist assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artist-assets'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);

create policy "Artists can update artist assets"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'artist-assets'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
)
with check (
  bucket_id = 'artist-assets'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);

create policy "Artists can delete artist assets"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artist-assets'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);
