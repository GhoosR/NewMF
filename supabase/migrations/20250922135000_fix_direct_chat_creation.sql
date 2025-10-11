-- Add a function to check if a direct chat should be created
CREATE OR REPLACE FUNCTION should_create_direct_chat(
  user_id_1 uuid,
  user_id_2 uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if users are already in a direct chat
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE type = 'direct'
    AND participant_ids @> ARRAY[user_id_1, user_id_2]
    AND array_length(participant_ids, 1) = 2
  ) THEN
    RETURN false;
  END IF;

  -- Check if users are in a group chat together
  IF EXISTS (
    SELECT 1 FROM conversations
    WHERE type = 'group'
    AND participant_ids @> ARRAY[user_id_1, user_id_2]
  ) THEN
    -- Don't create direct chat if they're only in group chats together
    RETURN false;
  END IF;

  RETURN true;
END;
$$;








