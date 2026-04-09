alter table public.client_submissions
add column if not exists selected_design_id text,
add column if not exists reference_image_url text,
add column if not exists reference_image_path text,
add column if not exists reference_description text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-references',
  'submission-references',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can read submission reference images"
on storage.objects
for select
using (bucket_id = 'submission-references');

create policy "Anon can upload submission reference images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'submission-references');
