-- Create the storage buckets the app uses. Buckets were previously created by
-- hand in the Supabase dashboard (see note in 002_storage_policies.sql) and never
-- captured as a migration, so a fresh project had none. This makes storage fully
-- reproducible. Policies for avatars/cvs/notes/job-logos live in 002; the
-- chat-media and society-posts policies are added here.

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars',       'avatars',       true, 10485760),
  ('notes',         'notes',         true, 52428800),
  ('cvs',           'cvs',           true, 52428800),
  ('job-logos',     'job-logos',     true, 10485760),
  ('chat-media',    'chat-media',    true, 52428800),
  ('society-posts', 'society-posts', true, 52428800)
on conflict (id) do update set public = excluded.public,
                               file_size_limit = excluded.file_size_limit;

-- chat-media policies (referenced by chat upload code)
drop policy if exists "chat_media_public_read" on storage.objects;
create policy "chat_media_public_read"
  on storage.objects for select using (bucket_id = 'chat-media');

drop policy if exists "chat_media_auth_upload" on storage.objects;
create policy "chat_media_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-media');

drop policy if exists "chat_media_owner_delete" on storage.objects;
create policy "chat_media_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'chat-media' and owner = auth.uid());

-- society-posts policies
drop policy if exists "society_posts_public_read" on storage.objects;
create policy "society_posts_public_read"
  on storage.objects for select using (bucket_id = 'society-posts');

drop policy if exists "society_posts_auth_upload" on storage.objects;
create policy "society_posts_auth_upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'society-posts');

drop policy if exists "society_posts_owner_delete" on storage.objects;
create policy "society_posts_owner_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'society-posts' and owner = auth.uid());
