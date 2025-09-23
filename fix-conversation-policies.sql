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

CREATE POLICY "Users can update their conversations"
ON conversations
FOR UPDATE
USING (
  auth.uid() = ANY(participant_ids)
)
WITH CHECK (
  -- Only allow updating last_message, last_message_at, last_viewed_by, last_viewed_at
  (
    (OLD.last_message IS DISTINCT FROM NEW.last_message) OR
    (OLD.last_message_at IS DISTINCT FROM NEW.last_message_at) OR
    (OLD.last_viewed_by IS DISTINCT FROM NEW.last_viewed_by) OR
    (OLD.last_viewed_at IS DISTINCT FROM NEW.last_viewed_at)
  )
  -- Ensure these fields don't change
  AND OLD.type = NEW.type
  AND OLD.participant_ids = NEW.participant_ids
  AND OLD.created_by = NEW.created_by
  AND OLD.admin_id = NEW.admin_id
  AND OLD.max_participants = NEW.max_participants
);

