alter table public.artist_support_messages
add column if not exists admin_reply text;

create table if not exists public.artist_notifications (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  title text not null,
  body text not null,
  sender_label text not null default 'Admin',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.artist_notifications enable row level security;

create policy "Artists can view their own notifications"
on public.artist_notifications
for select
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_notifications.artist_id
      and artists.user_id = auth.uid()
  )
);

create policy "Artists can update their own notifications"
on public.artist_notifications
for update
using (
  exists (
    select 1
    from public.artists
    where artists.id = artist_notifications.artist_id
      and artists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_notifications.artist_id
      and artists.user_id = auth.uid()
  )
);
