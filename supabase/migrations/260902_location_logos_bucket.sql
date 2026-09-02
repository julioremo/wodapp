-- 1. Create the public bucket with strict format and size limits
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'location_logos',
  'location_logos',
  true,
  2097152, -- 2MB
  array['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
);

-- 2. Public Read Access (Required for the UI to display them)
create policy "Logos are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'location_logos' );

-- 3. Add logo_url column to locations table
alter table public.locations
  add column if not exists logo_url text;