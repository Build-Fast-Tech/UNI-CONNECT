-- Chat: additional policies for channels table

-- Allow authenticated users to create DM and university channels
create policy "channels_insert_auth"
  on channels for insert
  with check (
    auth.role() = 'authenticated'
    and type in ('dm', 'university', 'branch')
  );

-- Allow DM participants to update their channel (e.g. last_read)
create policy "channels_update_dm"
  on channels for update
  using (
    dm_user_a = auth.uid() or dm_user_b = auth.uid()
  );
