-- Enable RLS on conversation_participants table
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Allow users to view participants in conversations they are part of
CREATE POLICY "Users can view participants in their conversations"
ON conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.uid() = ANY(participant_ids)
  )
);

-- Allow users to join conversations they are invited to
CREATE POLICY "Users can join conversations they are invited to"
ON conversation_participants FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.uid() = ANY(participant_ids)
  )
);

-- Allow users to leave conversations they are part of
CREATE POLICY "Users can leave conversations"
ON conversation_participants FOR DELETE
USING (
  user_id = auth.uid()
);

-- Add trigger to sync conversation_participants with participant_ids
CREATE OR REPLACE FUNCTION sync_conversation_participants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insert new participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    SELECT NEW.id, unnest(NEW.participant_ids)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
    
    -- Remove participants that are no longer in participant_ids
    DELETE FROM conversation_participants
    WHERE conversation_id = NEW.id
    AND user_id != ALL(NEW.participant_ids);
  ELSIF TG_OP = 'DELETE' THEN
    -- Remove all participants when conversation is deleted
    DELETE FROM conversation_participants
    WHERE conversation_id = OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_conversation_participants_trigger ON conversations;

-- Create trigger
CREATE TRIGGER sync_conversation_participants_trigger
AFTER INSERT OR UPDATE OR DELETE ON conversations
FOR EACH ROW
EXECUTE FUNCTION sync_conversation_participants();



