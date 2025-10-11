-- Create function to remove group chat member
CREATE OR REPLACE FUNCTION remove_group_chat_member(
  conversation_id uuid,
  member_id uuid
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
    RETURN jsonb_build_object('success', false, 'error', 'Only admin can remove members');
  END IF;

  -- Check if member exists
  IF NOT member_id = ANY(_conversation.participant_ids) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Member not found in group');
  END IF;

  -- Don't allow removing the admin
  IF member_id = _conversation.admin_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot remove the group admin');
  END IF;

  -- Remove member
  UPDATE conversations
  SET 
    participant_ids = array_remove(participant_ids, member_id),
    last_message = 'Member removed from group',
    last_message_at = now()
  WHERE id = conversation_id
  RETURNING * INTO _conversation;

  -- Check minimum members
  IF array_length(_conversation.participant_ids, 1) < 2 THEN
    -- Revert the update
    UPDATE conversations
    SET 
      participant_ids = array_append(participant_ids, member_id)
    WHERE id = conversation_id;
    
    RETURN jsonb_build_object('success', false, 'error', 'Group must have at least 2 members');
  END IF;

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








