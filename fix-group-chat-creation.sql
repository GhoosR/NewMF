/*
  # Fix Group Chat Creation Issue
  
  This migration fixes the critical issue with group chat creation
  where the conversations_participant_ids_check constraint is failing.
  
  Issues Fixed:
  1. Check constraint logic for participant_ids validation
  2. Ensure max_participants has proper default values
  3. Fix any NULL values in required fields
  4. Update RLS policies to work with the fixed constraints
*/

-- First, let's check and fix any existing data issues
DO $$ 
BEGIN
  -- Fix any NULL max_participants values
  UPDATE conversations 
  SET max_participants = CASE 
    WHEN type = 'direct' THEN 2
    WHEN type = 'group' THEN 5
    ELSE 2
  END
  WHERE max_participants IS NULL;
  
  -- Fix any NULL participant_ids (shouldn't happen but just in case)
  UPDATE conversations 
  SET participant_ids = '{}'
  WHERE participant_ids IS NULL;
  
  -- Ensure created_by and admin_id are set for existing records
  UPDATE conversations 
  SET created_by = admin_id
  WHERE created_by IS NULL AND admin_id IS NOT NULL;
  
  UPDATE conversations 
  SET admin_id = created_by
  WHERE admin_id IS NULL AND created_by IS NOT NULL;
END $$;

-- Drop the problematic constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

-- Add a more robust check constraint
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) > 0 AND
    CASE
      WHEN type = 'direct' THEN 
        array_length(participant_ids, 1) = 2 AND
        max_participants = 2
      WHEN type = 'group' THEN 
        array_length(participant_ids, 1) >= 2 AND 
        array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
        max_participants >= 2
      ELSE false
    END
  );

-- Ensure max_participants has a NOT NULL constraint with proper defaults
ALTER TABLE conversations ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN max_participants SET DEFAULT 2;

-- Update existing records to have proper defaults
UPDATE conversations 
SET max_participants = CASE 
  WHEN type = 'direct' THEN 2
  WHEN type = 'group' THEN 5
  ELSE 2
END
WHERE max_participants IS NULL;

-- Fix RLS policies to work with the updated constraints
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create group conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create direct conversations" ON conversations;

-- Create a unified create policy that handles both direct and group chats
CREATE POLICY "create_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  auth.uid() = ANY(participant_ids) AND
  (
    (type = 'direct' AND 
     array_length(participant_ids, 1) = 2 AND 
     max_participants = 2) OR
    (type = 'group' AND 
     array_length(participant_ids, 1) >= 2 AND 
     array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
     auth.uid() = admin_id)
  )
);

-- Create a function to safely create group chats
CREATE OR REPLACE FUNCTION create_group_chat(
  group_name text,
  group_image_url text DEFAULT NULL,
  participant_user_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation conversations;
  _current_user_id uuid;
  _participant_ids uuid[];
  _max_participants int;
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Prepare participant IDs (include current user)
  _participant_ids := ARRAY[_current_user_id] || COALESCE(participant_user_ids, '{}');
  
  -- Remove duplicates and ensure current user is included
  _participant_ids := ARRAY(
    SELECT DISTINCT unnest(_participant_ids)
  );
  
  -- Validate participant count
  IF array_length(_participant_ids, 1) < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Group must have at least 2 participants'
    );
  END IF;
  
  IF array_length(_participant_ids, 1) > 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Group cannot have more than 5 participants'
    );
  END IF;
  
  _max_participants := 5;

  -- Create the conversation
  INSERT INTO conversations (
    type,
    name,
    image_url,
    participant_ids,
    created_by,
    admin_id,
    max_participants,
    last_message,
    last_message_at
  )
  VALUES (
    'group',
    group_name,
    group_image_url,
    _participant_ids,
    _current_user_id,
    _current_user_id,
    _max_participants,
    'Group created',
    now()
  )
  RETURNING * INTO _conversation;

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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_group_chat(text, text, uuid[]) TO authenticated;

-- Create a function to safely create direct chats
CREATE OR REPLACE FUNCTION create_direct_chat(
  other_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation conversations;
  _current_user_id uuid;
  _participant_ids uuid[];
BEGIN
  -- Get current user
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Validate other user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = other_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user'
    );
  END IF;

  -- Sort user IDs to ensure consistent order
  IF _current_user_id < other_user_id THEN
    _participant_ids := ARRAY[_current_user_id, other_user_id];
  ELSE
    _participant_ids := ARRAY[other_user_id, _current_user_id];
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

  -- Create new direct conversation
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
    _current_user_id,
    _current_user_id,
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_direct_chat(uuid) TO authenticated;

-- Ensure the unique index exists for direct chats
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_participants_idx 
ON conversations (participant_ids)
WHERE type = 'direct';

-- Add a comment explaining the fix
COMMENT ON CONSTRAINT conversations_participant_ids_check ON conversations IS 
'Ensures participant_ids array is valid: direct chats must have exactly 2 participants, group chats must have 2-5 participants based on max_participants limit';

