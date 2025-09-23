/*
  # Fix Chat Creation Function

  1. Changes
    - Improve chat creation function to handle edge cases
    - Add better error handling
    - Fix participant creation logic
    
  2. Security
    - Maintain proper access control
    - Add input validation
*/

-- Drop and recreate the chat creation function with better handling
CREATE OR REPLACE FUNCTION create_chat_with_participants(recipient_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_chat_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate recipient
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = recipient_id) THEN
    RAISE EXCEPTION 'Invalid recipient';
  END IF;

  -- Check if chat already exists
  SELECT cp1.chat_id INTO new_chat_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  WHERE cp1.user_id = current_user_id
  AND cp2.user_id = recipient_id
  LIMIT 1;

  -- Return existing chat if found
  IF new_chat_id IS NOT NULL THEN
    RETURN jsonb_build_object('chat_id', new_chat_id);
  END IF;

  -- Create new chat
  INSERT INTO chats DEFAULT VALUES
  RETURNING id INTO new_chat_id;

  -- Add participants
  INSERT INTO chat_participants (chat_id, user_id)
  VALUES
    (new_chat_id, current_user_id),
    (new_chat_id, recipient_id);

  RETURN jsonb_build_object('chat_id', new_chat_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create chat: %', SQLERRM;
END;
$$;