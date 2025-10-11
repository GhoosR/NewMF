-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they are invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Enable RLS on all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (auth.uid() = ANY(participant_ids))
WITH CHECK (auth.uid() = ANY(participant_ids));

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
  AND sender_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());

-- Conversation participants policies
CREATE POLICY "Users can view participants in their conversations"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_participants.conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);

CREATE POLICY "Users can join conversations they are invited to"
ON conversation_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);

CREATE POLICY "Users can leave conversations"
ON conversation_participants FOR DELETE
USING (user_id = auth.uid());

-- Function to update last viewed
CREATE OR REPLACE FUNCTION update_last_viewed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the user is a participant
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE id = NEW.id
    AND auth.uid() = ANY(participant_ids)
  ) THEN
    -- Update last viewed info
    NEW.last_viewed_by = auth.uid();
    NEW.last_viewed_at = NOW();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_last_viewed_trigger ON conversations;

-- Create trigger for last viewed updates
CREATE TRIGGER update_last_viewed_trigger
BEFORE UPDATE ON conversations
FOR EACH ROW
WHEN (NEW.last_viewed_by IS NOT NULL)
EXECUTE FUNCTION update_last_viewed();

-- Add trigger to sync conversation_participants with participant_ids
CREATE OR REPLACE FUNCTION sync_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insert new participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT NEW.id, unnest(NEW.participant_ids)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    -- Remove participants that are no longer in participant_ids
    DELETE FROM conversation_participants
    WHERE conversation_id = NEW.id
    AND user_id != ALL(NEW.participant_ids);
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove all participants when conversation is deleted
    DELETE FROM conversation_participants
    WHERE conversation_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_conversation_participants_trigger ON conversations;

-- Create trigger
CREATE TRIGGER sync_conversation_participants_trigger
AFTER INSERT OR UPDATE OR DELETE ON conversations
FOR EACH ROW
EXECUTE FUNCTION sync_conversation_participants();



