-- First, enable security definer on the RLS policies
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_group_updates" ON conversations;
DROP POLICY IF EXISTS "participant_updates" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;

-- Basic view policy
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Create policy
CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() = ANY(participant_ids) AND
  (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) >= 2)
  )
);

-- Group admin policy - can update everything
CREATE POLICY "group_admin_update"
ON conversations
FOR UPDATE
USING (
  type = 'group' AND
  auth.uid() = admin_id
)
WITH CHECK (
  type = 'group' AND
  auth.uid() = admin_id AND
  array_length(participant_ids, 1) >= 2
);

-- Direct chat policy - participants can update
CREATE POLICY "direct_chat_update"
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

-- Last viewed policy - any participant can update their own last viewed status
CREATE POLICY "last_viewed_update"
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

-- Message policies
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

-- Add some debugging functions
CREATE OR REPLACE FUNCTION check_conversation_access(conversation_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'conversation_exists', (SELECT EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id)),
    'is_member', (SELECT EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND auth.uid() = ANY(participant_ids))),
    'is_admin', (SELECT EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND auth.uid() = admin_id)),
    'conversation_type', (SELECT type FROM conversations WHERE id = conversation_id),
    'participant_count', (SELECT array_length(participant_ids, 1) FROM conversations WHERE id = conversation_id),
    'current_user', auth.uid(),
    'admin_id', (SELECT admin_id FROM conversations WHERE id = conversation_id)
  ) INTO result;
  
  RETURN result;
END;
$$;




