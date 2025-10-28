/*
  # Fix Existing Data and Set Up Clean Chat System
  
  This migration fixes existing data that violates constraints and sets up
  a clean system for direct chats vs group chats.
  
  Steps:
  1. First, examine and fix existing data
  2. Then apply new constraints
  3. Set up proper defaults and validation
*/

-- Step 1: Examine existing data issues
-- Let's see what we're working with
DO $$ 
DECLARE
  direct_count int;
  group_count int;
  null_max_count int;
  invalid_participant_count int;
BEGIN
  -- Count existing conversations by type
  SELECT COUNT(*) INTO direct_count FROM conversations WHERE type = 'direct';
  SELECT COUNT(*) INTO group_count FROM conversations WHERE type = 'group';
  SELECT COUNT(*) INTO null_max_count FROM conversations WHERE max_participants IS NULL;
  SELECT COUNT(*) INTO invalid_participant_count FROM conversations 
  WHERE participant_ids IS NULL OR array_length(participant_ids, 1) = 0;
  
  RAISE NOTICE 'Existing conversations - Direct: %, Group: %, NULL max_participants: %, Invalid participant_ids: %', 
    direct_count, group_count, null_max_count, invalid_participant_count;
END $$;

-- Step 2: Fix existing data BEFORE applying constraints

-- First, handle any NULL or empty participant_ids
UPDATE conversations 
SET participant_ids = '{}'
WHERE participant_ids IS NULL OR array_length(participant_ids, 1) = 0;

-- Fix max_participants for existing records
UPDATE conversations 
SET max_participants = CASE 
  WHEN type = 'direct' THEN 2
  WHEN type = 'group' THEN 5
  WHEN type IS NULL THEN 2  -- Default to direct if type is NULL
  ELSE 2
END
WHERE max_participants IS NULL;

-- Fix any NULL type values (assume they should be direct chats)
UPDATE conversations 
SET type = 'direct'
WHERE type IS NULL;

-- Fix any conversations that have wrong participant counts for their type
-- For direct chats with more than 2 participants, convert to group chats
UPDATE conversations 
SET type = 'group', max_participants = 5
WHERE type = 'direct' AND array_length(participant_ids, 1) > 2;

-- For direct chats with less than 2 participants, we need to handle this carefully
-- Let's delete any direct chats with invalid participant counts
DELETE FROM conversations 
WHERE type = 'direct' AND array_length(participant_ids, 1) != 2;

-- For group chats with less than 2 participants, convert to direct or delete
DELETE FROM conversations 
WHERE type = 'group' AND array_length(participant_ids, 1) < 2;

-- Step 3: Now we can safely apply the constraints

-- Drop the existing constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

-- Add the new constraint with proper validation
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

-- Ensure max_participants is NOT NULL with proper defaults
ALTER TABLE conversations ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN max_participants SET DEFAULT 2;

-- Ensure type is NOT NULL with proper default
ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN type SET DEFAULT 'direct';

-- Step 4: Set up proper RLS policies for the clean system

-- Drop existing policies
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create group conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create direct conversations" ON conversations;
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "update_conversations" ON conversations;

-- Create clean, simple policies

-- View policy - users can see conversations they participate in
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids)
);

-- Create policy for direct chats
CREATE POLICY "create_direct_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  type = 'direct' AND
  array_length(participant_ids, 1) = 2 AND
  max_participants = 2 AND
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = created_by
);

-- Create policy for group chats
CREATE POLICY "create_group_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  type = 'group' AND
  array_length(participant_ids, 1) >= 2 AND
  array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
  max_participants >= 2 AND
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = created_by AND
  auth.uid() = admin_id
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

-- Step 5: Create helper functions for creating chats

-- Function to create direct chats
CREATE OR REPLACE FUNCTION create_direct_chat(other_user_id uuid)
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
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate other user exists
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = other_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid user');
  END IF;

  -- Sort user IDs for consistent ordering
  IF _current_user_id < other_user_id THEN
    _participant_ids := ARRAY[_current_user_id, other_user_id];
  ELSE
    _participant_ids := ARRAY[other_user_id, _current_user_id];
  END IF;

  -- Check if direct chat already exists
  SELECT * INTO _conversation
  FROM conversations
  WHERE type = 'direct' AND participant_ids = _participant_ids;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'conversation', row_to_json(_conversation),
      'created', false
    );
  END IF;

  -- Create new direct chat
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
    -- Race condition - try to get existing conversation
    SELECT * INTO _conversation
    FROM conversations
    WHERE type = 'direct' AND participant_ids = _participant_ids;

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

-- Function to create group chats
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
BEGIN
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Prepare participant IDs (include current user)
  _participant_ids := ARRAY[_current_user_id] || COALESCE(participant_user_ids, '{}');
  
  -- Remove duplicates
  _participant_ids := ARRAY(
    SELECT DISTINCT unnest(_participant_ids)
  );
  
  -- Validate participant count
  IF array_length(_participant_ids, 1) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group must have at least 2 participants');
  END IF;
  
  IF array_length(_participant_ids, 1) > 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Group cannot have more than 5 participants');
  END IF;

  -- Create the group conversation
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
    5,
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
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_chat(text, text, uuid[]) TO authenticated;

-- Create unique index for direct chats
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_participants_idx 
ON conversations (participant_ids)
WHERE type = 'direct';

-- Final verification
DO $$ 
DECLARE
  direct_count int;
  group_count int;
  invalid_count int;
BEGIN
  SELECT COUNT(*) INTO direct_count FROM conversations WHERE type = 'direct';
  SELECT COUNT(*) INTO group_count FROM conversations WHERE type = 'group';
  SELECT COUNT(*) INTO invalid_count FROM conversations 
  WHERE (type = 'direct' AND array_length(participant_ids, 1) != 2)
     OR (type = 'group' AND (array_length(participant_ids, 1) < 2 OR array_length(participant_ids, 1) > 5));
  
  RAISE NOTICE 'After fix - Direct: %, Group: %, Invalid: %', direct_count, group_count, invalid_count;
  
  IF invalid_count > 0 THEN
    RAISE WARNING 'There are still % invalid conversations!', invalid_count;
  END IF;
END $$;

