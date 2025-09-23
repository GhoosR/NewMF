-- Drop existing policies
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "update_participants" ON conversations;
DROP POLICY IF EXISTS "update_last_viewed" ON conversations;
DROP POLICY IF EXISTS "update_direct_chats" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;

-- Enable RLS
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

-- Base policy for viewing conversations
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Policy for admins to update group chats
CREATE POLICY "admin_update_group_chats"
ON conversations
FOR UPDATE
USING (
  type = 'group' AND
  auth.uid() = admin_id
)
WITH CHECK (
  type = 'group' AND
  auth.uid() = admin_id AND
  array_length(participant_ids, 1) >= 2 AND
  array_length(participant_ids, 1) <= max_participants
);

-- Policy for participants to update last_viewed
CREATE POLICY "update_last_viewed"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = last_viewed_by
)
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = last_viewed_by
);

-- Policy for direct chat updates
CREATE POLICY "update_direct_chats"
ON conversations
FOR UPDATE
USING (
  type = 'direct' AND
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  type = 'direct' AND
  auth.uid() = ANY(participant_ids)
);

-- Policy for creating conversations
CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = created_by AND
  (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) >= 2 AND array_length(participant_ids, 1) <= max_participants)
  )
);

-- Add policy for messages
DROP POLICY IF EXISTS "send_messages" ON messages;
DROP POLICY IF EXISTS "read_messages" ON messages;

CREATE POLICY "send_messages"
ON messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);

CREATE POLICY "read_messages"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND auth.uid() = ANY(participant_ids)
  )
);




