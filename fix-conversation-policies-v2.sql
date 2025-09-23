-- Enable RLS on conversations table if not already enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create direct conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create group conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- Create policies for conversations table
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Users can create direct conversations"
ON conversations
FOR INSERT
WITH CHECK (
  type = 'direct'
  AND array_length(participant_ids, 1) = 2
  AND auth.uid() = ANY(participant_ids)
  AND auth.uid() = created_by
);

CREATE POLICY "Users can create group conversations"
ON conversations
FOR INSERT
WITH CHECK (
  type = 'group'
  AND array_length(participant_ids, 1) >= 2
  AND array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
  AND auth.uid() = ANY(participant_ids)
  AND auth.uid() = created_by
  AND auth.uid() = admin_id
);

-- Create a trigger function to validate updates
CREATE OR REPLACE FUNCTION validate_conversation_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow updating last_message, last_message_at, last_viewed_by, last_viewed_at
  IF (
    NEW.type != OLD.type OR
    NEW.participant_ids != OLD.participant_ids OR
    NEW.created_by != OLD.created_by OR
    NEW.admin_id != OLD.admin_id OR
    NEW.max_participants != OLD.max_participants
  ) THEN
    RAISE EXCEPTION 'Cannot modify conversation structure';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for update validation
DROP TRIGGER IF EXISTS validate_conversation_update_trigger ON conversations;
CREATE TRIGGER validate_conversation_update_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION validate_conversation_update();

-- Create update policy (simpler now that validation is in trigger)
CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = ANY(participant_ids))
WITH CHECK (auth.uid() = ANY(participant_ids));

