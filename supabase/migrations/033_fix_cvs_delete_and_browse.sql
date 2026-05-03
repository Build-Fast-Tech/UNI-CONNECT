-- Add missing delete policy so users can delete their own CVs
create policy "cvs_delete_own" on cvs for delete using (user_id = auth.uid());
