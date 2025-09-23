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
BEGIN
  -- Get conversation details
  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- Create notifications for all participants except the sender
  FOREACH v_participant_id IN ARRAY v_conversation.participant_ids
  LOOP
    -- Skip if it's the sender
    IF v_participant_id = NEW.sender_id THEN
      CONTINUE;
    END IF;

    -- Check if there's already a notification for this conversation (read or unread)
    -- If exists, update it; otherwise create new one
    IF EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_participant_id
      AND type = CASE WHEN v_conversation.type = 'group' THEN 'new_group_message' ELSE 'new_message' END
      AND (data->>'conversation_id')::uuid = NEW.conversation_id
    ) THEN
      -- Update existing notification
      UPDATE notifications
      SET 
        title = CASE 
          WHEN v_conversation.type = 'group' THEN 'New message in ' || v_conversation.name
          ELSE 'New message'
        END,
        message = CASE 
          WHEN v_conversation.type = 'group' THEN 'New message in ' || v_conversation.name
          ELSE 'New message'
        END,
        data = jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100)
        ),
        read = false,
        created_at = now()
      WHERE user_id = v_participant_id
      AND type = CASE WHEN v_conversation.type = 'group' THEN 'new_group_message' ELSE 'new_message' END
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
        CASE WHEN v_conversation.type = 'group' THEN 'new_group_message' ELSE 'new_message' END,
        CASE 
          WHEN v_conversation.type = 'group' THEN 'New message in ' || v_conversation.name
          ELSE 'New message'
        END,
        CASE 
          WHEN v_conversation.type = 'group' THEN 'New message in ' || v_conversation.name
          ELSE 'New message'
        END,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100)
        ),
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger to run after message insertion
CREATE TRIGGER create_message_notification_trigger
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION create_message_notification();

