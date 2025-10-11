-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add admin_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'admin_id'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN admin_id uuid REFERENCES auth.users(id);
  END IF;

  -- Add max_participants column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'max_participants'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN max_participants int DEFAULT 2;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;

  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN type text DEFAULT 'direct';
  END IF;

  -- Add participant_ids column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'participant_ids'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN participant_ids uuid[] NOT NULL DEFAULT '{}';
  END IF;

  -- Add last_message column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_message text DEFAULT '';
  END IF;

  -- Add last_message_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_message_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_message_at timestamptz DEFAULT now();
  END IF;

  -- Add last_viewed_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_viewed_by'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_viewed_by uuid REFERENCES auth.users(id);
  END IF;

  -- Add last_viewed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'conversations' 
    AND column_name = 'last_viewed_at'
  ) THEN
    ALTER TABLE conversations 
    ADD COLUMN last_viewed_at timestamptz DEFAULT now();
  END IF;

  -- Update any NULL values in required fields
  UPDATE conversations 
  SET 
    admin_id = created_by 
  WHERE admin_id IS NULL 
  AND created_by IS NOT NULL;

  UPDATE conversations 
  SET 
    max_participants = 2 
  WHERE max_participants IS NULL 
  AND type = 'direct';

  UPDATE conversations 
  SET 
    max_participants = 5 
  WHERE max_participants IS NULL 
  AND type = 'group';
END $$;

