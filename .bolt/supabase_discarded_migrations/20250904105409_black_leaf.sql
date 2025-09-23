/*
  # Fix conversations table schema

  1. Schema Updates
    - Add `conversation_type` column (text, default 'direct')
    - Add `group_name` column (text, nullable)
    - Remove the 2-participant limit constraint
    - Update RLS policies to handle group chats

  2. Data Migration
    - Set existing conversations to 'direct' type
    - Ensure backward compatibility

  3. Security
    - Update RLS policies for group chat support
    - Maintain existing security for direct chats
*/

-- Add missing columns to conversations table
DO $$
BEGIN
  -- Add conversation_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'conversation_type'
  ) THEN
    ALTER TABLE conversations ADD COLUMN conversation_type text DEFAULT 'direct';
  END IF;

  -- Add group_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'group_name'
  ) THEN
    ALTER TABLE conversations ADD COLUMN group_name text;
  END IF;
END $$;

-- Remove the 2-participant limit constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'conversations' AND constraint_name = 'conversations_participant_ids_check'
  ) THEN
    ALTER TABLE conversations DROP CONSTRAINT conversations_participant_ids_check;
  END IF;
END $$;

-- Add constraint for conversation_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'conversations' AND constraint_name = 'conversations_conversation_type_check'
  ) THEN
    ALTER TABLE conversations ADD CONSTRAINT conversations_conversation_type_check 
    CHECK (conversation_type IN ('direct', 'group'));
  END IF;
END $$;

-- Update existing conversations to have 'direct' type
UPDATE conversations 
SET conversation_type = 'direct' 
WHERE conversation_type IS NULL;

-- Make conversation_type NOT NULL after setting defaults
ALTER TABLE conversations ALTER COLUMN conversation_type SET NOT NULL;

-- Update RLS policies to handle group chats
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Recreate policies with group chat support
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY (participant_ids));

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = ANY (participant_ids));

CREATE POLICY "Users can update their conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY (participant_ids))
  WITH CHECK (auth.uid() = ANY (participant_ids));

CREATE POLICY "Users can delete their conversations"
  ON conversations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = ANY (participant_ids));