-- First, create a function to validate participant_ids against users
CREATE OR REPLACE FUNCTION check_participant_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all participant_ids exist in users table
  IF NOT (
    SELECT bool_and(EXISTS (
      SELECT 1 FROM auth.users WHERE id = participant_id
    ))
    FROM unnest(NEW.participant_ids) AS participant_id
  ) THEN
    RAISE EXCEPTION 'All participant_ids must reference existing users';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_participant_ids_trigger ON conversations;

-- Create trigger to validate participant_ids
CREATE TRIGGER check_participant_ids_trigger
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_participant_ids();

-- Create a junction table for participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Enable RLS on junction table
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Add policies for junction table
CREATE POLICY "Users can view conversations they are part of"
  ON conversation_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- Function to sync participant_ids with junction table
CREATE OR REPLACE FUNCTION sync_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete existing entries for this conversation
  DELETE FROM conversation_participants
  WHERE conversation_id = NEW.id;
  
  -- Insert new entries
  INSERT INTO conversation_participants (conversation_id, user_id)
  SELECT NEW.id, unnest(NEW.participant_ids);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_conversation_participants_trigger ON conversations;

-- Create trigger to sync participants
CREATE TRIGGER sync_conversation_participants_trigger
  AFTER INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION sync_conversation_participants();

-- Sync existing conversations
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT c.id, unnest(c.participant_ids)
FROM conversations c
ON CONFLICT DO NOTHING;




