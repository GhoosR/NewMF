-- Drop all existing constraints and triggers
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP TRIGGER IF EXISTS enforce_conversation_rules ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();
DROP FUNCTION IF EXISTS check_conversation_rules();
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;
DROP INDEX IF EXISTS unique_direct_participants;

-- Simple base constraint for participant count
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) >= 2 AND
    array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
  );

-- Simple trigger function for basic validation
CREATE OR REPLACE FUNCTION check_conversation_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- For direct conversations, ensure exactly 2 participants
  IF NEW.type = 'direct' AND array_length(NEW.participant_ids, 1) != 2 THEN
    RAISE EXCEPTION 'Direct conversations must have exactly 2 participants';
  END IF;

  -- For group conversations, ensure between 2 and max_participants
  IF NEW.type = 'group' AND array_length(NEW.participant_ids, 1) > COALESCE(NEW.max_participants, 5) THEN
    RAISE EXCEPTION 'Group conversations cannot have more than % participants', COALESCE(NEW.max_participants, 5);
  END IF;

  -- Ensure no duplicate participants in the same conversation
  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(NEW.participant_ids)) != array_length(NEW.participant_ids, 1) THEN
    RAISE EXCEPTION 'Duplicate participants are not allowed in the same conversation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_conversation_rules
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_rules();




