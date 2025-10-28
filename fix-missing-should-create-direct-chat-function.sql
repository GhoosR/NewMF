-- Fix missing should_create_direct_chat function
-- This function is needed by the chat system but may have been dropped by CASCADE operations

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

-- Also ensure the create_or_get_direct_chat function exists
CREATE OR REPLACE FUNCTION create_or_get_direct_chat(
  user1_id uuid,
  user2_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation conversations;
  _participant_ids uuid[];
BEGIN
  -- Sort user IDs to ensure consistent order
  IF user1_id < user2_id THEN
    _participant_ids := ARRAY[user1_id, user2_id];
  ELSE
    _participant_ids := ARRAY[user2_id, user1_id];
  END IF;

  -- Try to find existing direct chat
  SELECT * INTO _conversation
  FROM conversations
  WHERE type = 'direct'
  AND participant_ids = _participant_ids;

  -- If found, return it
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'conversation', row_to_json(_conversation),
      'created', false
    );
  END IF;

  -- Create new conversation
  INSERT INTO conversations (
    type,
    participant_ids,
    created_by,
    admin_id,
    max_participants,
    last_message,
    last_message_at
  )
  VALUES (
    'direct',
    _participant_ids,
    auth.uid(),
    auth.uid(),
    2,
    '',
    now()
  )
  RETURNING * INTO _conversation;

  RETURN jsonb_build_object(
    'success', true,
    'conversation', row_to_json(_conversation),
    'created', true
  );

EXCEPTION
  WHEN unique_violation THEN
    -- If we hit a race condition, try to get the existing conversation
    SELECT * INTO _conversation
    FROM conversations
    WHERE type = 'direct'
    AND participant_ids = _participant_ids;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'conversation', row_to_json(_conversation),
        'created', false
      );
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Failed to create direct chat');
    END IF;
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
