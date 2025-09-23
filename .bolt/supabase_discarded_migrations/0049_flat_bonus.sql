-- Function to find or create chat with participants
CREATE OR REPLACE FUNCTION create_chat_with_participants(recipient_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_chat_id UUID;
  new_chat_id UUID;
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if chat already exists
  SELECT cp1.chat_id INTO existing_chat_id
  FROM chat_participants cp1
  JOIN chat_participants cp2 ON cp1.chat_id = cp2.chat_id
  WHERE cp1.user_id = current_user_id
  AND cp2.user_id = recipient_id
  LIMIT 1;

  -- Return existing chat if found
  IF existing_chat_id IS NOT NULL THEN
    RETURN jsonb_build_object('chat_id', existing_chat_id);
  END IF;

  -- Create new chat if none exists
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