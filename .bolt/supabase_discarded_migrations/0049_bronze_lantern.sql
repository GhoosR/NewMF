-- Drop existing tables if they exist
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;

-- Create tables with proper constraints
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_participants (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chats_updated_at ON chats(updated_at DESC);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "chat_access" ON chats
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = id
    AND chat_participants.user_id = auth.uid()
  ));

CREATE POLICY "participant_view" ON chat_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "participant_insert" ON chat_participants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "message_access" ON chat_messages
  FOR SELECT TO authenticated
  USING (chat_id IN (
    SELECT chat_id FROM chat_participants
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "message_insert" ON chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM chat_participants
      WHERE user_id = auth.uid()
    )
  );