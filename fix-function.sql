-- Drop existing function
DROP FUNCTION IF EXISTS update_conversation_last_viewed(uuid, uuid);

-- Create the function with matching parameter names
CREATE OR REPLACE FUNCTION update_conversation_last_viewed(
  conversation_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the user is a participant
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND user_id = ANY(c.participant_ids)
  ) THEN
    RETURN;
  END IF;

  -- Update the last viewed timestamp
  UPDATE conversations c
  SET 
    last_viewed_by = user_id,
    last_viewed_at = now()
  WHERE c.id = conversation_id;

  -- Also update the conversation_participants table
  UPDATE conversation_participants cp
  SET last_viewed_at = now()
  WHERE cp.conversation_id = conversation_id
  AND cp.user_id = user_id;
END;
$$;


