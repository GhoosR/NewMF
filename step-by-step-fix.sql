-- Step-by-step fix for group chat creation
-- Run each section one at a time in Supabase SQL editor

-- STEP 1: Check what data we have
SELECT 
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  COUNT(*) as count
FROM conversations 
GROUP BY type, array_length(participant_ids, 1), max_participants
ORDER BY type, participant_count;

-- STEP 2: See problematic records
SELECT 
  id,
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  participant_ids
FROM conversations 
WHERE 
  (type = 'direct' AND array_length(participant_ids, 1) != 2) OR
  (type = 'group' AND (array_length(participant_ids, 1) < 2 OR array_length(participant_ids, 1) > 5)) OR
  max_participants IS NULL OR
  participant_ids IS NULL;

-- STEP 3: Fix NULL values first
UPDATE conversations 
SET participant_ids = '{}'
WHERE participant_ids IS NULL;

UPDATE conversations 
SET max_participants = CASE 
  WHEN type = 'direct' THEN 2
  WHEN type = 'group' THEN 5
  ELSE 2
END
WHERE max_participants IS NULL;

UPDATE conversations 
SET type = 'direct'
WHERE type IS NULL;

-- STEP 4: Fix invalid direct chats (convert to group if > 2 participants)
UPDATE conversations 
SET type = 'group', max_participants = 5
WHERE type = 'direct' AND array_length(participant_ids, 1) > 2;

-- STEP 5: Delete invalid conversations
DELETE FROM conversations 
WHERE type = 'direct' AND array_length(participant_ids, 1) != 2;

DELETE FROM conversations 
WHERE type = 'group' AND array_length(participant_ids, 1) < 2;

-- STEP 6: Drop the old constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

-- STEP 7: Add the new constraint
ALTER TABLE conversations ADD CONSTRAINT conversations_participant_ids_check
  CHECK (
    participant_ids IS NOT NULL AND
    array_length(participant_ids, 1) > 0 AND
    CASE
      WHEN type = 'direct' THEN 
        array_length(participant_ids, 1) = 2 AND
        max_participants = 2
      WHEN type = 'group' THEN 
        array_length(participant_ids, 1) >= 2 AND 
        array_length(participant_ids, 1) <= COALESCE(max_participants, 5) AND
        max_participants >= 2
      ELSE false
    END
  );

-- STEP 8: Set proper defaults
ALTER TABLE conversations ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN max_participants SET DEFAULT 2;
ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN type SET DEFAULT 'direct';

-- STEP 9: Verify the fix worked
SELECT 
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  COUNT(*) as count
FROM conversations 
GROUP BY type, array_length(participant_ids, 1), max_participants
ORDER BY type, participant_count;

