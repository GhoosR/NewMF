-- Add type and participant_ids columns to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS participant_ids UUID[] NOT NULL DEFAULT '{}';

-- Add constraint to ensure type is valid
ALTER TABLE conversations
ADD CONSTRAINT valid_conversation_type
CHECK (type IN ('direct', 'group'));

-- Update existing conversations with participant IDs
UPDATE conversations c
SET participant_ids = ARRAY(
  SELECT cp.user_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = c.id
  ORDER BY cp.created_at
);