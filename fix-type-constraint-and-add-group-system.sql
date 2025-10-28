-- Fix the type constraint and set up proper group chat system
-- This addresses the conversations_type_check error and adds group chat support

-- STEP 1: Drop the problematic type constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;

-- STEP 2: Add a slug field for group chats (unique identifier for group URLs)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS slug text;

-- STEP 3: Add other fields that might be missing for group chats
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- STEP 4: Create a function to generate unique slugs for group chats
CREATE OR REPLACE FUNCTION generate_group_slug(group_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from group name
  base_slug := lower(regexp_replace(group_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'group';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug already exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM conversations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- STEP 5: Add the new type constraint that allows both 'direct' and 'group'
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('direct', 'group'));

-- STEP 6: Set proper defaults
ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN type SET DEFAULT 'direct';

-- STEP 7: Create a trigger to auto-generate slugs for group chats
CREATE OR REPLACE FUNCTION set_group_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set slug for group chats that don't already have one
  IF NEW.type = 'group' AND (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_group_slug(COALESCE(NEW.name, 'Group Chat'));
  END IF;
  
  -- Clear slug for direct chats
  IF NEW.type = 'direct' THEN
    NEW.slug := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS set_group_slug_trigger ON conversations;
CREATE TRIGGER set_group_slug_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION set_group_slug();

-- STEP 8: Update the participant_ids constraint to work with the new system
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) > 0 AND
    CASE
      WHEN type = 'direct' THEN 
        array_length(participant_ids, 1) = 2 AND
        max_participants = 2 AND
        slug IS NULL
      WHEN type = 'group' THEN 
        array_length(participant_ids, 1) >= 2 AND 
        array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
        max_participants >= 2 AND
        slug IS NOT NULL
      ELSE false
    END
  );

-- STEP 9: Create helper functions for creating chats

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
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to create group chats
CREATE OR REPLACE FUNCTION create_group_chat(
  group_name text,
  group_description text DEFAULT NULL,
  group_image_url text DEFAULT NULL,
  participant_user_ids uuid[] DEFAULT NULL,
  is_public_group boolean DEFAULT false
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
  _slug text;
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

  -- Generate unique slug
  _slug := generate_group_slug(group_name);

  -- Create the group conversation
  INSERT INTO conversations (
    type,
    name,
    description,
    image_url,
    slug,
    participant_ids,
    created_by,
    admin_id,
    max_participants,
    is_public,
    last_message,
    last_message_at
  )
  VALUES (
    'group',
    group_name,
    group_description,
    group_image_url,
    _slug,
    _participant_ids,
    _current_user_id,
    _current_user_id,
    5,
    is_public_group,
    'Group created',
    now()
  )
  RETURNING * INTO _conversation;

  RETURN jsonb_build_object(
    'success', true,
    'conversation', row_to_json(_conversation),
    'slug', _slug
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function to get conversation by slug (for group chat URLs)
CREATE OR REPLACE FUNCTION get_conversation_by_slug(conversation_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conversation conversations;
  _current_user_id uuid;
BEGIN
  _current_user_id := auth.uid();
  IF _current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get the conversation
  SELECT * INTO _conversation
  FROM conversations
  WHERE slug = conversation_slug AND type = 'group';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Conversation not found');
  END IF;

  -- Check if user is a participant or if it's a public group
  IF _current_user_id = ANY(_conversation.participant_ids) OR _conversation.is_public THEN
    RETURN jsonb_build_object(
      'success', true,
      'conversation', row_to_json(_conversation)
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_direct_chat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_group_chat(text, text, text, uuid[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_by_slug(text) TO authenticated;

-- STEP 10: Create unique index for group chat slugs
CREATE UNIQUE INDEX IF NOT EXISTS conversations_slug_idx 
ON conversations (slug)
WHERE type = 'group' AND slug IS NOT NULL;

-- STEP 11: Create unique index for direct chats
CREATE UNIQUE INDEX IF NOT EXISTS conversations_direct_participants_idx 
ON conversations (participant_ids)
WHERE type = 'direct';

-- STEP 12: Update RLS policies
DROP POLICY IF EXISTS "create_conversations" ON conversations;
DROP POLICY IF EXISTS "create_direct_conversations" ON conversations;
DROP POLICY IF EXISTS "create_group_conversations" ON conversations;
DROP POLICY IF EXISTS "view_conversations" ON conversations;
DROP POLICY IF EXISTS "update_conversations" ON conversations;

-- View policy
CREATE POLICY "view_conversations"
ON conversations
FOR SELECT
USING (
  auth.uid() = ANY(participant_ids) OR
  (type = 'group' AND is_public = true)
);

-- Create policy for direct chats
CREATE POLICY "create_direct_conversations"
ON conversations
FOR INSERT
WITH CHECK (
  type = 'direct' AND
  array_length(participant_ids, 1) = 2 AND
  max_participants = 2 AND
  slug IS NULL AND
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
  slug IS NOT NULL AND
  auth.uid() = ANY(participant_ids) AND
  auth.uid() = created_by AND
  auth.uid() = admin_id
);

-- Update policy
CREATE POLICY "update_conversations"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  auth.uid() = ANY(participant_ids) AND
  (
    (type = 'direct') OR
    (type = 'group' AND (
      auth.uid() = admin_id OR
      auth.uid() = last_viewed_by
    ))
  )
);

-- STEP 13: Test the system
SELECT 'System setup complete! You can now create both direct and group chats.' as status;

