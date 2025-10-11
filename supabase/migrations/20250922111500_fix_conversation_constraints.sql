-- First, drop all related constraints and triggers to start fresh
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;

-- Add the base constraint for participant_ids
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) >= 2 AND
    array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
  );

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

  -- Ensure no duplicate participants
  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(NEW.participant_ids)) != array_length(NEW.participant_ids, 1) THEN
    RAISE EXCEPTION 'Duplicate participants are not allowed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the validation function
CREATE TRIGGER enforce_conversation_rules
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_rules();




