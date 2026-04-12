create table if not exists public.artist_support_messages (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists(id) on delete cascade,
  artist_name text not null,
  account_email text not null,
  message text not null,
  replied_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.artist_support_messages enable row level security;

create policy "Artists can create their own support messages"
on public.artist_support_messages
for insert
with check (
  exists (
    select 1
    from public.artists
    where artists.id = artist_support_messages.artist_id
      and artists.user_id = auth.uid()
  )
);
