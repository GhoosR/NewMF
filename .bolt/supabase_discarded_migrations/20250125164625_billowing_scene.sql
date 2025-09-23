-- Create function to compare arrays for uniqueness
CREATE OR REPLACE FUNCTION arrays_equal(array1 UUID[], array2 UUID[])
RETURNS boolean AS $$
BEGIN
  -- Sort arrays and compare
  RETURN (
    array_length(array1, 1) = array_length(array2, 1) 
    AND array1 @> array2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get sorted participant array
CREATE OR REPLACE FUNCTION sorted_participants(participant_ids UUID[])
RETURNS UUID[] AS $$
  SELECT array_agg(x ORDER BY x)
  FROM unnest($1) x;
$$ LANGUAGE SQL IMMUTABLE;

-- Add unique index for conversations
CREATE UNIQUE INDEX unique_direct_conversation 
ON conversations (type, sorted_participants(participant_ids))
WHERE type = 'direct';

-- Create function to safely create or get conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_creator_id UUID,
  p_participant_ids UUID[],
  p_type TEXT DEFAULT 'direct'
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_participant_exists BOOLEAN;
  v_sorted_participants UUID[];
BEGIN
  -- Sort participant IDs for consistent comparison
  v_sorted_participants := sorted_participants(p_participant_ids);

  -- Validate participants exist
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = ANY(p_participant_ids)
  ) INTO v_participant_exists;
  
  IF NOT v_participant_exists THEN
    RAISE EXCEPTION 'One or more participants do not exist';
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE type = p_type
  AND sorted_participants(participant_ids) = v_sorted_participants;

  -- Create new conversation if none exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (
      created_by,
      participant_ids,
      type,
      created_at,
      updated_at
    ) VALUES (
      p_creator_id,
      v_sorted_participants,
      p_type,
      now(),
      now()
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;