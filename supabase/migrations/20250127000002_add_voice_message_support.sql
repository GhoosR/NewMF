-- Add voice message support to messages table
-- This migration adds fields to support voice messages in the chat system

-- Add new columns to messages table for voice messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'file')),
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER, -- Duration in seconds
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER, -- File size in bytes
ADD COLUMN IF NOT EXISTS file_type TEXT; -- MIME type

-- Create index for message type for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Create index for audio messages specifically
CREATE INDEX IF NOT EXISTS idx_messages_audio_url ON messages(audio_url) WHERE audio_url IS NOT NULL;

-- Update existing messages to have 'text' type
UPDATE messages SET message_type = 'text' WHERE message_type IS NULL;

-- Add RLS policies for voice messages (they inherit the same policies as text messages)
-- The existing policies already cover all message types since they check conversation_id and sender_id

-- Create a function to validate voice message data
CREATE OR REPLACE FUNCTION validate_voice_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate voice message has required fields
  IF NEW.message_type = 'voice' THEN
    IF NEW.audio_url IS NULL THEN
      RAISE EXCEPTION 'Voice messages must have an audio_url';
    END IF;
    
    IF NEW.audio_duration IS NULL OR NEW.audio_duration <= 0 THEN
      RAISE EXCEPTION 'Voice messages must have a valid duration';
    END IF;
    
    -- Limit voice message duration to 5 minutes (300 seconds)
    IF NEW.audio_duration > 300 THEN
      RAISE EXCEPTION 'Voice messages cannot exceed 5 minutes';
    END IF;
  END IF;
  
  -- Validate file message has required fields
  IF NEW.message_type = 'file' THEN
    IF NEW.file_url IS NULL THEN
      RAISE EXCEPTION 'File messages must have a file_url';
    END IF;
    
    IF NEW.file_name IS NULL THEN
      RAISE EXCEPTION 'File messages must have a file_name';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate message data
DROP TRIGGER IF EXISTS validate_message_data ON messages;
CREATE TRIGGER validate_message_data
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_voice_message();

-- Update the message notification trigger to handle voice messages
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
  v_message_preview text;
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

  -- Determine notification type based on message type
  CASE NEW.message_type
    WHEN 'voice' THEN
      v_notification_type := 'voice_message';
      v_message_preview := '🎤 Voice message';
    WHEN 'file' THEN
      v_notification_type := 'file_message';
      v_message_preview := '📎 ' || COALESCE(NEW.file_name, 'File');
    ELSE
      v_notification_type := 'message';
      v_message_preview := LEFT(NEW.content, 100);
  END CASE;

  -- Create notifications for all participants except the sender
  FOREACH v_participant_id IN ARRAY v_conversation.participant_ids
  LOOP
    -- Skip if it's the sender
    IF v_participant_id = NEW.sender_id THEN
      CONTINUE;
    END IF;

    -- Check if notification already exists for this message
    IF NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = v_participant_id 
      AND type = v_notification_type
      AND (data->>'conversation_id')::uuid = NEW.conversation_id
      AND (data->>'message_id')::uuid = NEW.id
    ) THEN
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
          WHEN v_conversation.type = 'group' THEN v_sender_username || ': ' || v_message_preview
          ELSE v_message_preview
        END,
        jsonb_build_object(
          'conversation_id', NEW.conversation_id,
          'conversation_type', v_conversation.type,
          'conversation_name', v_conversation.name,
          'message_id', NEW.id,
          'message_type', NEW.message_type,
          'message_preview', v_message_preview,
          'sender_id', NEW.sender_id,
          'sender_username', v_sender_username,
          'sender_avatar_url', v_sender_avatar_url,
          'audio_duration', NEW.audio_duration,
          'file_name', NEW.file_name,
          'file_size', NEW.file_size
        ),
        false
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;




