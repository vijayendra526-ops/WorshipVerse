
-- WorshipVerse: songs table
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  language text not null check (language in ('te', 'en')),
  lyrics text not null,
  youtube_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists songs_language_idx
  on public.songs(language);

create index if not exists songs_title_idx
  on public.songs using gin (to_tsvector('simple', title));

alter table public.songs enable row level security;

-- Signed-in users can browse songs.
create policy "Authenticated users can read songs"
on public.songs
for select
to authenticated
using (true);

-- Publishing is reserved for users with admin roles.
-- This checks the role stored in the user's Supabase app metadata.
create policy "Admins can insert songs"
on public.songs
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
  and created_by = auth.uid()
);

create policy "Admins can update songs"
on public.songs
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
);

create policy "Admins can delete songs"
on public.songs
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'super_admin')
);
