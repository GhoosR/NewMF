-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their messages" ON messages;

DROP POLICY IF EXISTS "Users can view their conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Create conversation policies
CREATE POLICY "Users can view their conversations"
ON conversations FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (
  CASE
    WHEN type = 'direct' THEN
      array_length(participant_ids, 1) = 2 AND
      auth.uid() = ANY(participant_ids)
    WHEN type = 'group' THEN
      array_length(participant_ids, 1) >= 2 AND
      array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
      auth.uid() = ANY(participant_ids)
    ELSE false
  END
);

CREATE POLICY "Users can update their conversations"
ON conversations FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids) AND
  (type = 'direct' OR admin_id = auth.uid())
);

CREATE POLICY "Users can delete their conversations"
ON conversations FOR DELETE
USING (
  auth.uid() = ANY(participant_ids) AND
  (type = 'direct' OR admin_id = auth.uid())
);

-- Create message policies
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND auth.uid() = ANY(c.participant_ids)
  )
);

CREATE POLICY "Users can send messages to their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND auth.uid() = ANY(c.participant_ids)
  )
);

CREATE POLICY "Users can update their messages"
ON messages FOR UPDATE
USING (
  sender_id = auth.uid()
);

CREATE POLICY "Users can delete their messages"
ON messages FOR DELETE
USING (
  sender_id = auth.uid()
);

-- Create conversation participant policies
CREATE POLICY "Users can view their conversation participants"
ON conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND auth.uid() = ANY(c.participant_ids)
  )
);

CREATE POLICY "Users can join conversations"
ON conversation_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND (
      c.admin_id = auth.uid() OR
      auth.uid() = ANY(c.participant_ids)
    )
  )
);

CREATE POLICY "Users can leave conversations"
ON conversation_participants FOR DELETE
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND (
      c.admin_id = auth.uid() OR
      auth.uid() = ANY(c.participant_ids)
    )
  )
);

-- Drop the existing function first
DROP FUNCTION IF EXISTS update_conversation_last_viewed(uuid, uuid);

-- Create the function with new parameter names
CREATE FUNCTION update_conversation_last_viewed(
  conversation_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND user_id = ANY(participant_ids)
  ) THEN
    RETURN;
  END IF;

  -- Update the last viewed timestamp
  UPDATE conversations
  SET 
    last_viewed_by = user_id,
    last_viewed_at = now()
  WHERE id = conversation_id;

  -- Also update the conversation_participants table
  UPDATE conversation_participants
  SET last_viewed_at = now()
  WHERE conversation_id = conversation_id
  AND user_id = user_id;
END;
$$;
