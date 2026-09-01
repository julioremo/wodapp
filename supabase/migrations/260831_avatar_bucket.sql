-- Create the bucket and make it public (required for getPublicUrl to work)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

create policy "Users can upload their avatar"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "Users can update their avatar"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "Users can delete their avatar"
on storage.objects for delete
to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text);

create policy "Users can read their own avatar for management"
on storage.objects for select
to authenticated
using (bucket_id = 'avatars' and name = auth.uid()::text);