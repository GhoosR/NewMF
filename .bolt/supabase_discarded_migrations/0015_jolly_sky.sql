/*
  # Update conversations and participants tables

  1. Changes
    - Add created_by column to conversations table
    - Update conversation_participants policies
  
  2. Security
    - Add RLS policy for conversation_participants
    - Only allow users to add themselves or be added by conversation creator
*/

-- Add created_by column to conversations
ALTER TABLE conversations 
ADD COLUMN created_by UUID REFERENCES users(id);

-- Update existing conversations to set created_by
UPDATE conversations c
SET created_by = (
  SELECT cp.user_id 
  FROM conversation_participants cp 
  WHERE cp.conversation_id = c.id 
  ORDER BY cp.created_at ASC 
  LIMIT 1
);

-- Make created_by NOT NULL for future records
ALTER TABLE conversations 
ALTER COLUMN created_by SET NOT NULL;

-- Drop existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view own conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;

-- Create new policies
CREATE POLICY "Users can view own conversations" 
ON conversation_participants FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

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