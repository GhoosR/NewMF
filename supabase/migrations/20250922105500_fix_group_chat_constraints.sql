-- Drop existing constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;

-- Add updated check constraint for max participants
ALTER TABLE conversations
  ADD CONSTRAINT max_participants_check 
  CHECK (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) >= 2 AND array_length(participant_ids, 1) <= COALESCE(max_participants, 5))
  );

-- Drop existing trigger
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();

-- Create updated function to validate participant count
CREATE OR REPLACE FUNCTION check_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'group' AND array_length(NEW.participant_ids, 1) > COALESCE(NEW.max_participants, 5) THEN
    RAISE EXCEPTION 'Number of participants exceeds the maximum limit';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER enforce_participant_limit
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_participant_count();




