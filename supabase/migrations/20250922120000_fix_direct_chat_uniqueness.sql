-- Create a unique index to prevent duplicate direct chats between the same users
CREATE UNIQUE INDEX IF NOT EXISTS unique_direct_chat_participants 
ON conversations (type, participant_ids)
WHERE type = 'direct';

-- Add a check constraint to ensure direct chats have exactly 2 participants
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS direct_chat_participants_check;
ALTER TABLE conversations
ADD CONSTRAINT direct_chat_participants_check
CHECK (
  (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
  (type = 'group' AND array_length(participant_ids, 1) BETWEEN 2 AND max_participants)
);




