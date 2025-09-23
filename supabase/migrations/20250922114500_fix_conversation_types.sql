-- Drop existing type constraint if it exists
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add new type constraint that matches our needs
ALTER TABLE conversations 
  ADD CONSTRAINT conversations_type_check 
  CHECK (type IN ('direct', 'group'));

-- Update any existing 'dm' types to 'direct' if needed
UPDATE conversations 
SET type = 'direct' 
WHERE type = 'dm';

-- Drop all previous constraints from our earlier attempts
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP TRIGGER IF EXISTS enforce_conversation_rules ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();
DROP FUNCTION IF EXISTS check_conversation_rules();
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;
DROP INDEX IF EXISTS unique_direct_participants;

-- Add simple constraints
ALTER TABLE conversations
  ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) >= 2 AND
    array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
  );

-- Simple validation function
CREATE OR REPLACE FUNCTION check_conversation_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic validations only
  IF NEW.type = 'direct' AND array_length(NEW.participant_ids, 1) != 2 THEN
    RAISE EXCEPTION 'Direct conversations must have exactly 2 participants';
  END IF;

  IF NEW.type = 'group' AND array_length(NEW.participant_ids, 1) > COALESCE(NEW.max_participants, 5) THEN
    RAISE EXCEPTION 'Group conversations cannot have more than % participants', COALESCE(NEW.max_participants, 5);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_conversation_rules
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_rules();




