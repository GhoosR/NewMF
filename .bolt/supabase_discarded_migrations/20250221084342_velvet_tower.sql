-- Remove participant_ids column from conversations
DO $$ 
BEGIN
  -- Remove participant_ids column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'participant_ids'
  ) THEN
    ALTER TABLE conversations 
    DROP COLUMN participant_ids;
  END IF;

  -- Drop existing policies
  DROP POLICY IF EXISTS "View conversations" ON conversations;
  DROP POLICY IF EXISTS "Create conversations" ON conversations;
  DROP POLICY IF EXISTS "Update conversations" ON conversations;
  DROP POLICY IF EXISTS "Delete conversations" ON conversations;

  -- Create new policies without participant_ids
  CREATE POLICY "View conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
      )
    );

  CREATE POLICY "Create conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (created_by = auth.uid());

  CREATE POLICY "Update conversations"
    ON conversations FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid());

  CREATE POLICY "Delete conversations"
    ON conversations FOR DELETE
    TO authenticated
    USING (created_by = auth.uid());

  -- Drop participant_ids index if it exists
  DROP INDEX IF EXISTS idx_conversations_participant_ids;
END $$;