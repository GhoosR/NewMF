-- First, let's check if the function exists and its current definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'update_conversation_last_viewed';

-- Drop the existing function
DROP FUNCTION IF EXISTS update_conversation_last_viewed(uuid, uuid);

-- Create a simpler version of the function
CREATE OR REPLACE FUNCTION update_conversation_last_viewed(
  conversation_id uuid,
  user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
BEGIN
  -- Simple update without complex checks
  UPDATE conversations
  SET 
    last_viewed_by = user_id,
    last_viewed_at = now()
  WHERE id = conversation_id
  AND user_id = ANY(participant_ids);

  -- Update the participants table
  UPDATE conversation_participants
  SET last_viewed_at = now()
  WHERE conversation_id = conversation_id
  AND user_id = user_id;

  -- Return success
  RETURN;
END;
$$;


