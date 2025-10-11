-- Create a stored procedure for updating last viewed
CREATE OR REPLACE FUNCTION update_conversation_last_viewed(conversation_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  -- Only proceed if the user is a participant
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND user_id = ANY(participant_ids)
  ) THEN
    -- Update last viewed info
    UPDATE conversations
    SET 
      last_viewed_by = user_id,
      last_viewed_at = NOW()
    WHERE id = conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



