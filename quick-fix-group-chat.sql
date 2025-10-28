-- Quick fix for group chat creation issue
-- Run this in your Supabase SQL editor

-- 1. Drop the problematic constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

-- 2. Fix any NULL values in existing data
UPDATE conversations 
SET max_participants = CASE 
  WHEN type = 'direct' THEN 2
  WHEN type = 'group' THEN 5
  ELSE 2
END
WHERE max_participants IS NULL;

-- 3. Add the constraint back with proper logic
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) > 0 AND
    CASE
      WHEN type = 'direct' THEN 
        array_length(participant_ids, 1) = 2
      WHEN type = 'group' THEN 
        array_length(participant_ids, 1) >= 2 AND 
        array_length(participant_ids, 1) <= COALESCE(max_participants, 5)
      ELSE false
    END
  );

-- 4. Ensure max_participants is NOT NULL
ALTER TABLE conversations ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN max_participants SET DEFAULT 2;

-- 5. Update existing records
UPDATE conversations 
SET max_participants = CASE 
  WHEN type = 'direct' THEN 2
  WHEN type = 'group' THEN 5
  ELSE 2
END
WHERE max_participants IS NULL;

