alter table public.profiles
add column if not exists google_email text;

alter table public.materials
add column if not exists access_provider text not null default 'supabase_storage',
add column if not exists access_note text,
add column if not exists allow_download boolean not null default true;

update public.materials
set
  access_provider = 'supabase_storage',
  access_note = 'This private file link expires shortly.',
  allow_download = true
where kind = 'pdf';

update public.materials
set
  access_provider = 'google_drive',
  access_note = 'Open with the Google account that has course video access.',
  allow_download = false
where kind = 'video';

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);
