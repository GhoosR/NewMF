/*
  # Fix Conversation Chat System
  
  This migration fixes the critical bug in the create_or_get_direct_chat function
  and ensures proper RLS policies are in place.
  
  Issues Fixed:
  1. Missing 'success', true in exception handler of create_or_get_direct_chat function
  2. RLS policies that may be preventing proper conversation creation
  3. Function permissions
*/

-- Fix the create_or_get_direct_chat stored procedure
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
        'success', true,  -- This line was missing in the original!
        'conversation', row_to_json(_conversation),
        'created', false
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Failed to create or find direct chat'
      );
    END IF;
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Fix RLS policies for conversations table
-- Ensure the create_or_get_direct_chat function can work properly

-- First, ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "update_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_can_update_group" ON conversations;
DROP POLICY IF EXISTS "group_admin_update" ON conversations;
DROP POLICY IF EXISTS "direct_chat_update" ON conversations;
DROP POLICY IF EXISTS "last_viewed_update" ON conversations;
DROP POLICY IF EXISTS "admin_group_updates" ON conversations;
DROP POLICY IF EXISTS "participant_updates" ON conversations;

-- Create clean, simple policies

-- View policy - users can see conversations they participate in
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Create policy - users can create conversations they participate in
CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() = ANY(participant_ids) AND
  (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) >= 2)
  )
);

-- Update policy - participants can update conversations
CREATE POLICY "update_conversations"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  (
    -- For direct chats, any participant can update
    (type = 'direct') OR
    -- For group chats, admin can update everything, participants can update last_viewed
    (type = 'group' AND (
      auth.uid() = admin_id OR
      auth.uid() = last_viewed_by
    ))
  )
);

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION create_or_get_direct_chat(uuid, uuid) TO authenticated;

-- Ensure the unique index exists for direct chats
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_participants_idx 
ON conversations (participant_ids)
WHERE type = 'direct';


