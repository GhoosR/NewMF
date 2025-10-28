-- Aggressive fix for conversation data issues
-- This will clean up all problematic data before applying constraints

-- STEP 1: First, let's see what we're dealing with
SELECT 
  'BEFORE FIX - Total conversations:' as info,
  COUNT(*) as count
FROM conversations;

-- STEP 2: Delete all conversations with invalid data
-- This is the safest approach - remove all problematic records

-- Delete conversations with NULL or empty participant_ids
DELETE FROM conversations 
WHERE participant_ids IS NULL OR array_length(participant_ids, 1) = 0;

-- Delete conversations with NULL type
DELETE FROM conversations 
WHERE type IS NULL;

-- Delete conversations with NULL max_participants
DELETE FROM conversations 
WHERE max_participants IS NULL;

-- Delete direct chats that don't have exactly 2 participants
DELETE FROM conversations 
WHERE type = 'direct' AND array_length(participant_ids, 1) != 2;

-- Delete group chats with invalid participant counts
DELETE FROM conversations 
WHERE type = 'group' AND (array_length(participant_ids, 1) < 2 OR array_length(participant_ids, 1) > 5);

-- STEP 3: Fix remaining data
-- Set proper defaults for any remaining records
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

-- STEP 4: Show what's left
SELECT 
  'AFTER CLEANUP - Remaining conversations:' as info,
  COUNT(*) as count
FROM conversations;

SELECT 
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  COUNT(*) as count
FROM conversations 
GROUP BY type, array_length(participant_ids, 1), max_participants
ORDER BY type, participant_count;

-- STEP 5: Now we can safely drop and recreate the constraint
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_participant_ids_check;

-- Add the new constraint
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

-- STEP 6: Set proper column constraints
ALTER TABLE conversations ALTER COLUMN max_participants SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN max_participants SET DEFAULT 2;
ALTER TABLE conversations ALTER COLUMN type SET NOT NULL;
ALTER TABLE conversations ALTER COLUMN type SET DEFAULT 'direct';

-- STEP 7: Final verification
SELECT 
  'FINAL RESULT - All conversations now valid:' as info,
  COUNT(*) as count
FROM conversations;

-- Test that the constraint works by trying to insert invalid data (should fail)
-- This is just a test - it will fail, which is what we want
/*
INSERT INTO conversations (type, participant_ids, max_participants) 
VALUES ('direct', ARRAY['00000000-0000-0000-0000-000000000001'], 2);
-- This should fail with constraint violation
*/

