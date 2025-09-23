-- First, disable RLS temporarily to clean up
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Drop ALL triggers with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations CASCADE;
DROP TRIGGER IF EXISTS check_participant_count ON conversations CASCADE;
DROP TRIGGER IF EXISTS prevent_structure_modification ON conversations CASCADE;
DROP TRIGGER IF EXISTS update_conversation_structure ON conversations CASCADE;
DROP TRIGGER IF EXISTS validate_conversation_update ON conversations CASCADE;
DROP TRIGGER IF EXISTS validate_conversation_update_trigger ON conversations CASCADE;

-- Drop ALL functions with CASCADE
DROP FUNCTION IF EXISTS check_participant_count() CASCADE;
DROP FUNCTION IF EXISTS prevent_structure_modification() CASCADE;
DROP FUNCTION IF EXISTS validate_conversation_update() CASCADE;
DROP FUNCTION IF EXISTS update_conversation_structure() CASCADE;
DROP FUNCTION IF EXISTS add_group_chat_member(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS is_conversation_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_conversation_access(uuid) CASCADE;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_can_update_group" ON conversations;
DROP POLICY IF EXISTS "group_admin_update" ON conversations;
DROP POLICY IF EXISTS "direct_chat_update" ON conversations;
DROP POLICY IF EXISTS "last_viewed_update" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_group_updates" ON conversations;
DROP POLICY IF EXISTS "participant_updates" ON conversations;
DROP POLICY IF EXISTS "users can update their group chats" ON conversations;
DROP POLICY IF EXISTS "users can create group chats" ON conversations;
DROP POLICY IF EXISTS "users can view group chats" ON conversations;

-- Drop ALL existing constraints except primary key
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS participant_count_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversation_structure_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Re-create only the essential constraints
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
  CHECK (type IN ('direct', 'group'));

-- Re-enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create minimal policies
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

CREATE POLICY "update_conversations"
ON conversations
FOR UPDATE
USING (
  (type = 'group' AND auth.uid() = admin_id) OR
  (auth.uid() = ANY(participant_ids))
)
WITH CHECK (
  (type = 'group' AND auth.uid() = admin_id) OR
  (auth.uid() = ANY(participant_ids))
);

CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() = ANY(participant_ids)
);

-- Create a simple function to add members
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
BEGIN
  -- Get conversation
  SELECT * INTO _conversation
  FROM conversations
  WHERE id = conversation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;

  -- Check if it's a group chat
  IF _conversation.type != 'group' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a group chat');
  END IF;

  -- Check if caller is admin
  IF auth.uid() != _conversation.admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admin can add members');
  END IF;

  -- Check if user is already a member
  IF new_member_id = ANY(_conversation.participant_ids) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User is already a member');
  END IF;

  -- Update conversation
  UPDATE conversations
  SET 
    participant_ids = array_append(participant_ids, new_member_id),
    last_message = 'New member added to group',
    last_message_at = now()
  WHERE id = conversation_id
  RETURNING * INTO _conversation;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'conversation', row_to_json(_conversation)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;




