/*
  # Add group chat support

  1. Updates to conversations table:
    - Add name and image_url for group chats
    - Add max_participants limit
    - Add admin_id for group management
*/

-- Add new columns to conversations table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'name') THEN
        ALTER TABLE conversations ADD COLUMN name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'image_url') THEN
        ALTER TABLE conversations ADD COLUMN image_url text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'admin_id') THEN
        ALTER TABLE conversations ADD COLUMN admin_id uuid REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'max_participants') THEN
        ALTER TABLE conversations ADD COLUMN max_participants int DEFAULT 5;
    END IF;
END $$;

-- Drop existing constraint if it exists
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS max_participants_check;

-- Add check constraint for max participants
ALTER TABLE conversations
  ADD CONSTRAINT max_participants_check 
  CHECK (
    (type = 'direct' AND array_length(participant_ids, 1) = 2) OR
    (type = 'group' AND array_length(participant_ids, 1) <= max_participants)
  );

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_participant_limit ON conversations;
DROP FUNCTION IF EXISTS check_participant_count();

-- Add trigger to validate participant count
CREATE OR REPLACE FUNCTION check_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'group' AND array_length(NEW.participant_ids, 1) > NEW.max_participants THEN
    RAISE EXCEPTION 'Group chat cannot have more than % participants', NEW.max_participants;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_participant_limit
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_participant_count();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create group chats" ON conversations;
DROP POLICY IF EXISTS "Users can update their group chats" ON conversations;

-- Update RLS policies for group chats
CREATE POLICY "Users can create group chats"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    type = 'group' AND
    auth.uid() = admin_id AND
    auth.uid() = ANY(participant_ids)
  );

CREATE POLICY "Users can update their group chats"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid() = admin_id AND
    type = 'group'
  )
  WITH CHECK (
    auth.uid() = admin_id AND
    type = 'group'
  );