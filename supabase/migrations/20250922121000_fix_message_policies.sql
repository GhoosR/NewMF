-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages in conversations they are part of
CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.uid() = ANY(participant_ids)
  )
);

-- Allow users to insert messages in conversations they are part of
CREATE POLICY "Users can insert messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE auth.uid() = ANY(participant_ids)
  )
);

-- Allow users to update their own messages
CREATE POLICY "Users can update their own messages"
ON messages FOR UPDATE
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON messages FOR DELETE
USING (sender_id = auth.uid());



