-- Drop any existing notification triggers
DROP TRIGGER IF EXISTS create_message_notification_trigger ON messages;
DROP FUNCTION IF EXISTS create_message_notification();

-- Create function to create notifications when messages are sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation conversations%ROWTYPE;
  v_participant_id uuid;
  v_sender_username text;
  v_sender_avatar_url text;
BEGIN
  -- Get conversation details
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Exit early if conversation not found
  IF v_conversation.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender information
  SELECT username, avatar_url INTO v_sender_username, v_sender_avatar_url
  FROM users
  WHERE id = NEW.sender_id;

  -- Exit early if sender not found
  IF v_sender_username IS NULL THEN
    RETURN NEW;
  END IF;

  -- Log conversation type for debugging
  RAISE NOTICE 'Processing message for conversation type: %, name: %, sender: %, participant_count: %, conversation_id: %', 
    v_conversation.type, v_conversation.name, v_sender_username, array_length(v_conversation.participant_ids, 1), NEW.conversation_id;

  -- Create notifications for all participants except the sender
  FOREACH v_participant_id IN ARRAY v_conversation.participant_ids
  LOOP
    -- Skip if it's the sender
    IF v_participant_id = NEW.sender_id THEN
      CONTINUE;
    END IF;

    -- Determine notification type based on conversation type
    DECLARE
      v_notification_type text;
    BEGIN
      v_notification_type := CASE WHEN v_conversation.type = 'group' THEN 'new_group_message' ELSE 'new_message' END;
      
      -- Log notification type for debugging
      RAISE NOTICE 'Creating notification for participant % with type: %, conversation_type: %, title: %', 
        v_participant_id, v_notification_type, v_conversation.type,
        CASE 
          WHEN v_conversation.type = 'group' THEN v_sender_username || ' sent a message in ' || v_conversation.name
          ELSE v_sender_username || ' sent you a message'
        END;
      
      -- Check if there's already a notification for this conversation (read or unread)
      -- If exists, update it; otherwise create new one
      IF EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = v_participant_id
        AND type = v_notification_type
        AND (data->>'conversation_id')::uuid = NEW.conversation_id
      ) THEN
      -- Update existing notification
      UPDATE notifications
      SET 
        title = CASE 
          WHEN v_conversation.type = 'group' THEN v_sender_username || ' sent a message in ' || v_conversation.name
          ELSE v_sender_username || ' sent you a message'
        END,
        message = CASE 
          WHEN v_conversation.type = 'group' THEN v_sender_username || ': ' || LEFT(NEW.content, 50) || (CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END)
          ELSE LEFT(NEW.content, 100)
        END,
        data = jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100),
          'sender_id', NEW.sender_id,
          'sender_username', v_sender_username,
          'sender_avatar_url', v_sender_avatar_url
        ),
        read = false,
        created_at = now()
      WHERE user_id = v_participant_id
      AND type = v_notification_type
      AND (data->>'conversation_id')::uuid = NEW.conversation_id;
    ELSE
      -- Create new notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        read
      ) VALUES (
        v_participant_id,
        v_notification_type,
        CASE 
          WHEN v_conversation.type = 'group' THEN v_sender_username || ' sent a message in ' || v_conversation.name
          ELSE v_sender_username || ' sent you a message'
        END,
        CASE 
          WHEN v_conversation.type = 'group' THEN v_sender_username || ': ' || LEFT(NEW.content, 50) || (CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END)
          ELSE LEFT(NEW.content, 100)
        END,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100),
          'sender_id', NEW.sender_id,
          'sender_username', v_sender_username,
          'sender_avatar_url', v_sender_avatar_url
        ),
        false
      );
    END IF;
    END; -- End of DECLARE block
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to run after message insertion
CREATE TRIGGER create_message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

