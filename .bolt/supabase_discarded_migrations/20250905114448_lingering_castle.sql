/*
  # Fix message notifications to consolidate properly

  1. Updates
    - Modify the message notification trigger to handle consolidation properly
    - Ensure only one notification exists per conversation
    - Update existing notifications instead of creating duplicates

  2. Changes
    - Update the notify_new_message function to consolidate notifications
    - Delete old notifications before creating new ones
    - Ensure proper message preview in notifications
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS notify_new_message ON messages;

-- Create or replace the notification function with proper consolidation
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_profile RECORD;
  existing_notification_id UUID;
BEGIN
  -- Get the recipient (the other participant in the conversation)
  SELECT participant_ids INTO recipient_id
  FROM conversations 
  WHERE id = NEW.conversation_id;
  
  -- Extract the recipient ID (the one that's not the sender)
  SELECT unnest(participant_ids) INTO recipient_id
  FROM conversations 
  WHERE id = NEW.conversation_id
  AND unnest(participant_ids) != NEW.sender_id
  LIMIT 1;
  
  -- Get sender profile information
  SELECT username, avatar_url INTO sender_profile
  FROM users 
  WHERE id = NEW.sender_id;
  
  -- Delete any existing notifications for this conversation
  DELETE FROM notifications 
  WHERE user_id = recipient_id 
    AND type = 'new_message' 
    AND data->>'conversation_id' = NEW.conversation_id::text;
  
  -- Create new notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    recipient_id,
    'new_message',
    'New Message',
    sender_profile.username || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id,
      'sender_username', sender_profile.username,
      'sender_avatar_url', sender_profile.avatar_url,
      'message_preview', LEFT(NEW.content, 100)
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();