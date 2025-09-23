-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Group admins can update all fields" ON conversations;
DROP POLICY IF EXISTS "Group participants can update last_viewed" ON conversations;
DROP POLICY IF EXISTS "Direct chat participants can update" ON conversations;
DROP POLICY IF EXISTS "Group participants can view group chats" ON conversations;
DROP POLICY IF EXISTS "Users can create group chats" ON conversations;
DROP POLICY IF EXISTS "Users can update their group chats" ON conversations;
DROP POLICY IF EXISTS "Group admins can update participant_ids" ON conversations;
DROP POLICY IF EXISTS "Admins can update participant_ids" ON conversations;
DROP POLICY IF EXISTS "Participants can update last_viewed" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Enable RLS
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

-- Base policy for viewing conversations
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Policy for updating participant_ids (admin only)
CREATE POLICY "update_participants"
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

-- Policy for updating last_viewed fields (any participant)
CREATE POLICY "update_last_viewed"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
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