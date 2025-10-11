-- Fix RLS policies for conversations table
-- Ensure the create_or_get_direct_chat function can work properly

-- First, ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "update_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_can_update_group" ON conversations;
DROP POLICY IF EXISTS "group_admin_update" ON conversations;
DROP POLICY IF EXISTS "direct_chat_update" ON conversations;
DROP POLICY IF EXISTS "last_viewed_update" ON conversations;
DROP POLICY IF EXISTS "admin_group_updates" ON conversations;
DROP POLICY IF EXISTS "participant_updates" ON conversations;

-- Create clean, simple policies

-- View policy - users can see conversations they participate in
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Create policy - users can create conversations they participate in
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

-- Update policy - participants can update conversations
CREATE POLICY "update_conversations"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  (
    -- For direct chats, any participant can update
    (type = 'direct') OR
    -- For group chats, admin can update everything, participants can update last_viewed
    (type = 'group' AND (
      auth.uid() = admin_id OR
      auth.uid() = last_viewed_by
    ))
  )
);

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION create_or_get_direct_chat(uuid, uuid) TO authenticated;