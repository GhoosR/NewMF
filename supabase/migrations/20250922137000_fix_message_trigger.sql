-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_direct_chat_creation_trigger ON messages;
DROP FUNCTION IF EXISTS check_direct_chat_creation();

-- Create function to check if direct chat should be created
CREATE OR REPLACE FUNCTION check_direct_chat_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_type text;
  v_participant_ids uuid[];
BEGIN
  -- Get conversation type and participant_ids
  SELECT type, participant_ids
  INTO v_conversation_type, v_participant_ids
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Only proceed if this is a group chat
  IF v_conversation_type = 'group' THEN
    -- Check if a direct chat exists between sender and other participants
    DECLARE
      participant_id uuid;
    BEGIN
      FOREACH participant_id IN ARRAY v_participant_ids
      LOOP
        -- Skip if it's the sender
        IF participant_id = NEW.sender_id THEN
          CONTINUE;
        END IF;

        -- Check if direct chat should be created using our function
        IF (SELECT should_create_direct_chat(NEW.sender_id, participant_id)) THEN
          -- If true, we want to prevent the message from being sent
          -- This shouldn't happen because we've already checked in the application layer
          -- But just in case, we'll raise an exception
          RAISE EXCEPTION 'Direct chat creation is not allowed between group chat members';
        END IF;
      END LOOP;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER check_direct_chat_creation_trigger
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION check_direct_chat_creation();
