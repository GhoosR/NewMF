-- Simple fix for duplicate notifications
-- This migration ensures only one notification per conversation per user

-- First, clean up any existing duplicate notifications
DELETE FROM notifications 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, type, (data->>'conversation_id')::uuid 
             ORDER BY created_at DESC
           ) as rn
    FROM notifications
    WHERE type IN ('new_message', 'new_group_message')
      AND data->>'conversation_id' IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- Update the existing trigger function to be more explicit about preventing duplicates
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
  v_notification_type text;
  v_notification_title text;
  v_notification_message text;
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

  -- Determine notification type and content based on conversation type
  IF v_conversation.type = 'group' THEN
    v_notification_type := 'new_group_message';
    v_notification_title := v_sender_username || ' sent a message in ' || COALESCE(v_conversation.name, 'the group');
    v_notification_message := v_sender_username || ': ' || LEFT(NEW.content, 50) || 
      CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END;
  ELSE
    v_notification_type := 'new_message';
    v_notification_title := v_sender_username || ' sent you a message';
    v_notification_message := LEFT(NEW.content, 100);
  END IF;

  -- Create notifications for all participants except the sender
  FOREACH v_participant_id IN ARRAY v_conversation.participant_ids
  LOOP
    -- Skip if it's the sender
    IF v_participant_id = NEW.sender_id THEN
      CONTINUE;
    END IF;

    -- Check if there's already an unread notification for this conversation and user
    -- If exists, update it; otherwise create new one
    IF EXISTS (
      SELECT 1 FROM notifications
      WHERE user_id = v_participant_id
        AND type = v_notification_type
        AND (data->>'conversation_id')::uuid = NEW.conversation_id
        AND read = false
    ) THEN
      -- Update existing unread notification
      UPDATE notifications
      SET 
        title = v_notification_title,
        message = v_notification_message,
        data = jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100),
          'sender_id', NEW.sender_id,
          'sender_username', v_sender_username,
          'sender_avatar_url', v_sender_avatar_url,
          'other_user_id', CASE WHEN v_conversation.type = 'direct' THEN NEW.sender_id ELSE NULL END
        ),
        created_at = now()
      WHERE user_id = v_participant_id
        AND type = v_notification_type
        AND (data->>'conversation_id')::uuid = NEW.conversation_id
        AND read = false;
    ELSE
      -- Create new notification only if no unread notification exists for this conversation
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
        v_notification_title,
        v_notification_message,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_preview', LEFT(NEW.content, 100),
          'sender_id', NEW.sender_id,
          'sender_username', v_sender_username,
          'sender_avatar_url', v_sender_avatar_url,
          'other_user_id', CASE WHEN v_conversation.type = 'direct' THEN NEW.sender_id ELSE NULL END
        ),
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
