-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Add praticipants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_participants;
DROP POLICY IF EXISTS "View participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

-- Create single INSERT policy with correct logic
CREATE POLICY "Users can add participants" 
ON conversation_participants FOR INSERT 
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) -- Allow users to add themselves
  OR EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid() -- Allow the conversation creator to add participants
  )
);

-- Create single SELECT policy with correct logic
CREATE POLICY "Users can view conversation participants" 
ON conversation_participants FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() 
  OR conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);