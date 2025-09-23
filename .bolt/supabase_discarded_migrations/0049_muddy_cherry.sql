-- Drop existing policies first
DO $$ 
BEGIN
  -- Chat policies
  DROP POLICY IF EXISTS "Users can view their chats" ON chats;
  DROP POLICY IF EXISTS "Users can create chats" ON chats;
  
  -- Participant policies
  DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
  DROP POLICY IF EXISTS "Users can join chats" ON chat_participants;
  DROP POLICY IF EXISTS "Users can update their last read timestamp" ON chat_participants;
  
  -- Message policies
  DROP POLICY IF EXISTS "Chat participants can view messages" ON chat_messages;
  DROP POLICY IF EXISTS "Chat participants can send messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create tables if they don't exist
DO $$ 
BEGIN
  -- Chats table
  CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Chat participants table
  CREATE TABLE IF NOT EXISTS chat_participants (
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (chat_id, user_id)
  );

  -- Chat messages table
  CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "chat_select_policy_v1"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_id = id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_insert_policy_v1"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "participant_select_policy_v1"
  ON chat_participants FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "participant_insert_policy_v1"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participant_update_policy_v1"
  ON chat_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "message_select_policy_v1"
  ON chat_messages FOR SELECT
  USING (
    chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "message_insert_policy_v1"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    chat_id IN (
      SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "message_update_policy_v1"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_chat_message_created ON chat_messages;
DROP FUNCTION IF EXISTS update_chat_timestamp();

-- Recreate function and trigger
CREATE OR REPLACE FUNCTION update_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats
  SET updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_timestamp();