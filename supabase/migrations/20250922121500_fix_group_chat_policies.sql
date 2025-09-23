-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their group chats" ON conversations;
DROP POLICY IF EXISTS "Group admins can update participant_ids" ON conversations;

-- Add separate policies for different update scenarios
-- Admin can update anything in their group chats
CREATE POLICY "Group admins can update all fields"
ON conversations
FOR UPDATE
USING (
  type = 'group' AND auth.uid() = admin_id
)
WITH CHECK (
  type = 'group' AND auth.uid() = admin_id
);

-- Participants can update last_viewed fields
CREATE POLICY "Group participants can update last_viewed"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = last_viewed_by
);

-- Direct chat participants can update their chats
CREATE POLICY "Direct chat participants can update"
ON conversations
FOR UPDATE
USING (
  type = 'direct' AND auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  type = 'direct' AND auth.uid() = ANY(participant_ids)
);

-- Add policy for group chat participants
CREATE POLICY "Group participants can view group chats"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Add policy for group chat messages
CREATE POLICY "Group participants can send messages"
ON messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);

-- Add policy for reading messages
CREATE POLICY "Group participants can read messages"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);