-- Add last_viewed_at column to conversation_participants if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversation_participants' 
    AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE conversation_participants 
    ADD COLUMN last_viewed_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update the conversations table update function to be simpler
CREATE OR REPLACE FUNCTION update_conversation_last_viewed(
  conversation_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the conversations table
  UPDATE conversations
  SET 
    last_viewed_by = user_id,
    last_viewed_at = now()
  WHERE id = conversation_id
  AND user_id = ANY(participant_ids);
END;
$$;


