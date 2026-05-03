CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS message_reactions_message_id_idx ON message_reactions(message_id);
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_select" ON message_reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "reactions_insert" ON message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
