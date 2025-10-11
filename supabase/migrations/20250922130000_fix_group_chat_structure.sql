-- First, remove any existing triggers that might interfere
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP TRIGGER IF EXISTS check_participant_count ON conversations;
DROP TRIGGER IF EXISTS prevent_structure_modification ON conversations;

-- Drop existing policies
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "admin_group_updates" ON conversations;
DROP POLICY IF EXISTS "participant_updates" ON conversations;
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "group_admin_update" ON conversations;
DROP POLICY IF EXISTS "direct_chat_update" ON conversations;
DROP POLICY IF EXISTS "last_viewed_update" ON conversations;

-- Drop existing constraints that might interfere
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS participant_count_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversation_structure_check;

-- Add basic constraints
ALTER TABLE conversations ADD CONSTRAINT participant_count_check
  CHECK (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) >= 2)
  );

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

-- Single update policy for admins
CREATE POLICY "admin_can_update_group"
ON conversations
FOR UPDATE
USING (
  CASE
    -- Group admin can update anything
    WHEN type = 'group' AND auth.uid() = admin_id THEN true
    -- Direct chat participants can update last_viewed
    WHEN type = 'direct' AND auth.uid() = ANY(participant_ids) THEN true
    -- Participants can update last_viewed
    WHEN auth.uid() = ANY(participant_ids) AND auth.uid() = last_viewed_by THEN true
    ELSE false
  END
)
WITH CHECK (
  CASE
    -- Group admin can update anything
    WHEN type = 'group' AND auth.uid() = admin_id THEN true
    -- Direct chat participants can update last_viewed
    WHEN type = 'direct' AND auth.uid() = ANY(participant_ids) THEN true
    -- Participants can update last_viewed
    WHEN auth.uid() = ANY(participant_ids) AND auth.uid() = last_viewed_by THEN true
    ELSE false
  END
);

-- Function to add member to group chat
CREATE OR REPLACE FUNCTION add_group_chat_member(
  conversation_id uuid,
  new_member_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv record;
  result json;
BEGIN
  -- Get conversation
  SELECT * INTO conv FROM conversations 
  WHERE id = conversation_id AND type = 'group';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Group chat not found';
  END IF;
  
  -- Check if caller is admin
  IF auth.uid() != conv.admin_id THEN
    RAISE EXCEPTION 'Only admin can add members';
  END IF;
  
  -- Check if user is already a member
  IF new_member_id = ANY(conv.participant_ids) THEN
    RAISE EXCEPTION 'User is already a member';
  END IF;
  
  -- Update conversation
  UPDATE conversations
  SET 
    participant_ids = array_append(participant_ids, new_member_id),
    last_message = 'New member added to group',
    last_message_at = now()
  WHERE id = conversation_id
  RETURNING * INTO conv;
  
  result := json_build_object(
    'success', true,
    'conversation', row_to_json(conv)
  );
  
  RETURN result;
END;
$$;








