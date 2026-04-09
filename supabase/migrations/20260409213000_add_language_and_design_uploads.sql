alter table public.artist_funnel_settings
add column if not exists default_language text not null default 'en'
check (default_language in ('en', 'tr'));

alter table public.artist_featured_designs
add column if not exists image_path text,
add column if not exists active boolean not null default true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artist-designs',
  'artist-designs',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read artist design images"
on storage.objects
for select
using (bucket_id = 'artist-designs');

create policy "Artists can upload their own design images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'artist-designs'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);

create policy "Artists can update their own design images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'artist-designs'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
)
with check (
  bucket_id = 'artist-designs'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);

create policy "Artists can delete their own design images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'artist-designs'
  and exists (
    select 1
    from public.artists
    where artists.user_id = auth.uid()
      and split_part(name, '/', 1) = artists.id::text
  )
);
