-- Storage bucket policies (buckets already created via dashboard)

-- avatars policies
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_own_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- notes policies
create policy "notes_public_read"
  on storage.objects for select
  using (bucket_id = 'notes');

create policy "notes_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- cvs policies (private — only owner or employers)
create policy "cvs_own_read"
  on storage.objects for select
  using (
    bucket_id = 'cvs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cvs_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'cvs'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- job-logos policies
create policy "job_logos_public_read"
  on storage.objects for select
  using (bucket_id = 'job-logos');

create policy "job_logos_auth_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'job-logos'
    and auth.role() = 'authenticated'
  );
