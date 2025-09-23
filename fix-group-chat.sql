-- Create trigger to automatically add participants when a conversation is created
CREATE OR REPLACE FUNCTION add_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert entries for each participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  SELECT NEW.id, unnest(NEW.participant_ids);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS conversation_participants_trigger ON conversations;

-- Create trigger
CREATE TRIGGER conversation_participants_trigger
AFTER INSERT ON conversations
FOR EACH ROW
EXECUTE FUNCTION add_conversation_participants();

-- Add RLS policy for conversation_participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversation participants" ON conversation_participants;
CREATE POLICY "Users can view their own conversation participants"
ON conversation_participants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND auth.uid() = ANY(c.participant_ids)
  )
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);

-- Update existing conversations to add participants
INSERT INTO conversation_participants (conversation_id, user_id)
SELECT c.id, unnest(c.participant_ids)
FROM conversations c
WHERE NOT EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = c.id
  AND cp.user_id = ANY(c.participant_ids)
)
ON CONFLICT DO NOTHING;

