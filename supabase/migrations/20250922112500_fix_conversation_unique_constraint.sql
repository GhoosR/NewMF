-- Drop all existing constraints and triggers to start fresh
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP TRIGGER IF EXISTS enforce_conversation_rules ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();
DROP FUNCTION IF EXISTS check_conversation_rules();
DROP FUNCTION IF EXISTS get_conversation_key(text, uuid[]);
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_direct_participants;
DROP INDEX IF EXISTS unique_direct_participants;

-- Create function to validate conversation rules
CREATE OR REPLACE FUNCTION check_conversation_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- For direct conversations, ensure exactly 2 participants
  IF NEW.type = 'direct' AND array_length(NEW.participant_ids, 1) != 2 THEN
    RAISE EXCEPTION 'Direct conversations must have exactly 2 participants';
  END IF;

  -- For group conversations, ensure between 2 and max_participants
  IF NEW.type = 'group' AND (
    array_length(NEW.participant_ids, 1) < 2 OR
    array_length(NEW.participant_ids, 1) > COALESCE(NEW.max_participants, 5)
  ) THEN
    RAISE EXCEPTION 'Group conversations must have between 2 and % participants', COALESCE(NEW.max_participants, 5);
  END IF;

  -- Ensure no duplicate participants in the array
  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(NEW.participant_ids)) != array_length(NEW.participant_ids, 1) THEN
    RAISE EXCEPTION 'Duplicate participants are not allowed in the same conversation';
  END IF;

  -- For direct conversations, ensure unique participant combinations
  IF NEW.type = 'direct' THEN
    IF EXISTS (
      SELECT 1 FROM conversations
      WHERE type = 'direct'
      AND id != NEW.id  -- Skip current row for updates
      AND participant_ids && NEW.participant_ids  -- Check for any overlap
      AND array_length(participant_ids & NEW.participant_ids, 1) = 2  -- Both participants match
    ) THEN
      RAISE EXCEPTION 'A direct conversation between these participants already exists';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the validation function
CREATE TRIGGER enforce_conversation_rules
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_rules();

-- Add base constraint for participant_ids
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) >= 2 AND
    array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
  );

-- Create partial index for direct conversations to enforce uniqueness
CREATE UNIQUE INDEX unique_direct_participants 
ON conversations ((participant_ids[1]), (participant_ids[2]))
WHERE type = 'direct' AND 
      participant_ids[1] < participant_ids[2];  -- Ensure consistent ordering