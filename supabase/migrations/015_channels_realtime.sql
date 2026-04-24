-- Enable realtime for channels so inbox notification hook can pick up newly
-- created DM channels without a page reload.
alter table channels replica identity full;
alter publication supabase_realtime add table channels;
