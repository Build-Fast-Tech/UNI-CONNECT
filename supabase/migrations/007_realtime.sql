-- Enable realtime for messages table
alter table messages replica identity full;
alter publication supabase_realtime add table messages;
