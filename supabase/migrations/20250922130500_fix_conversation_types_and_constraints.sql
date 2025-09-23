-- Drop existing constraints
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_pkey CASCADE;
DROP INDEX IF EXISTS conversations_participant_ids_direct_idx;

-- Add new type check constraint
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('direct', 'group'));

-- Update any existing 'dm' types to 'direct'
UPDATE conversations SET type = 'direct' WHERE type = 'dm';

-- Add new participant_ids check constraint
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    CASE
      WHEN type = 'direct' THEN array_length(participant_ids, 1) = 2
      WHEN type = 'group' THEN array_length(participant_ids, 1) >= 2 AND array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
      ELSE false
    END
  );

-- Create a unique index for direct conversations to prevent duplicates
CREATE UNIQUE INDEX conversations_direct_participants_idx ON conversations (
  (array_sort(participant_ids))
) WHERE type = 'direct';

-- Create a function to sort arrays for the unique index
CREATE OR REPLACE FUNCTION array_sort(anyarray)
RETURNS anyarray AS $$
  SELECT array_agg(x ORDER BY x)
  FROM unnest($1) x;
$$ LANGUAGE SQL IMMUTABLE;

-- Create a trigger to sync conversation_participants with participant_ids
CREATE OR REPLACE FUNCTION sync_conversation_participants()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Delete any participants not in the new participant_ids array
    DELETE FROM conversation_participants
    WHERE conversation_id = NEW.id
    AND user_id != ALL(NEW.participant_ids);

    -- Insert any new participants from participant_ids array
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT NEW.id, unnest(NEW.participant_ids)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Delete all participants when conversation is deleted
    DELETE FROM conversation_participants
    WHERE conversation_id = OLD.id;
    
    RETURN OLD;
  END IF;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_conversation_participants_trigger ON conversations;

-- Create trigger
CREATE TRIGGER sync_conversation_participants_trigger
AFTER INSERT OR UPDATE OR DELETE ON conversations
FOR EACH ROW
EXECUTE FUNCTION sync_conversation_participants();
