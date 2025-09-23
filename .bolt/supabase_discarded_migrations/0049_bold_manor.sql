-- Create a function to handle chat creation with participants
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