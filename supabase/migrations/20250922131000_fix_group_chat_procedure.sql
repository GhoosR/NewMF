-- First, let's clean up everything to start fresh
DROP FUNCTION IF EXISTS add_group_chat_member;
DROP POLICY IF EXISTS "admin_can_update_group" ON conversations;
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;

-- Enable RLS
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;

-- Basic view policy
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Create policy
CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() = ANY(participant_ids)
);

-- Admin update policy
CREATE POLICY "admin_can_update_group"
ON conversations
FOR UPDATE
USING (
  (type = 'group' AND auth.uid() = admin_id) OR
  (auth.uid() = ANY(participant_ids))
);

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_conversation_admin(conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND type = 'group'
    AND admin_id = auth.uid()
  );
END;
$$;

-- Create the member addition function
CREATE OR REPLACE FUNCTION add_group_chat_member(
  conversation_id uuid,
  new_member_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation conversations;
  _is_admin boolean;
BEGIN
  -- Check if conversation exists and get its data
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  -- Check if it's a group chat
  IF _conversation.type != 'group' THEN
    RAISE EXCEPTION 'Not a group chat';
  END IF;

  -- Check if caller is admin
  SELECT is_conversation_admin(conversation_id) INTO _is_admin;
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Only admin can add members';
  END IF;

  -- Check if user is already a member
  IF new_member_id = ANY(_conversation.participant_ids) THEN
    RAISE EXCEPTION 'User is already a member';
  END IF;

  -- Check max participants
  IF array_length(_conversation.participant_ids, 1) >= _conversation.max_participants THEN
    RAISE EXCEPTION 'Maximum number of participants reached';
  END IF;

  -- Update the conversation
  UPDATE conversations
  SET 
    participant_ids = array_append(participant_ids, new_member_id),
    last_message = 'New member added to group',
    last_message_at = now()
  WHERE id = conversation_id
  RETURNING * INTO _conversation;

  -- Return the updated conversation
  RETURN jsonb_build_object(
    'success', true,
    'conversation', row_to_json(_conversation)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;








