ALTER TABLE messages ADD COLUMN IF NOT EXISTS poll_data JSONB;
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll_votes_select" ON poll_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "poll_votes_insert" ON poll_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll_votes_update" ON poll_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
