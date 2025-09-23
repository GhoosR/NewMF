-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;

-- Create simplified SELECT policy
CREATE POLICY "View conversation participants"
ON conversation_participants FOR SELECT
TO authenticated
USING (
  -- User can view if they are a participant
  user_id = auth.uid()
  OR
  -- User can view other participants in conversations they're in
  EXISTS (
    SELECT 1 
    FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);

-- Create simplified INSERT policy
CREATE POLICY "Add conversation participants"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can add themselves
  user_id = auth.uid()
  OR
  -- Conversation creator can add others
  EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND c.created_by = auth.uid()
  )
);