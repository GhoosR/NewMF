-- Diagnostic script to identify problematic conversation data
-- Run this first to see what's causing the constraint violation

-- 1. Check all conversations and their data
SELECT 
  id,
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  participant_ids,
  created_by,
  admin_id,
  created_at
FROM conversations 
ORDER BY created_at DESC;

-- 2. Check for NULL values
SELECT 
  'NULL participant_ids' as issue,
  COUNT(*) as count
FROM conversations 
WHERE participant_ids IS NULL

UNION ALL

SELECT 
  'NULL max_participants' as issue,
  COUNT(*) as count
FROM conversations 
WHERE max_participants IS NULL

UNION ALL

SELECT 
  'NULL type' as issue,
  COUNT(*) as count
FROM conversations 
WHERE type IS NULL

UNION ALL

SELECT 
  'Empty participant_ids' as issue,
  COUNT(*) as count
FROM conversations 
WHERE array_length(participant_ids, 1) = 0;

-- 3. Check for invalid direct chats
SELECT 
  'Invalid direct chats' as issue,
  COUNT(*) as count
FROM conversations 
WHERE type = 'direct' AND array_length(participant_ids, 1) != 2;

-- 4. Check for invalid group chats
SELECT 
  'Invalid group chats' as issue,
  COUNT(*) as count
FROM conversations 
WHERE type = 'group' AND (array_length(participant_ids, 1) < 2 OR array_length(participant_ids, 1) > 5);

-- 5. Show specific problematic records
SELECT 
  'PROBLEMATIC RECORDS:' as info,
  id,
  type,
  array_length(participant_ids, 1) as participant_count,
  max_participants,
  participant_ids
FROM conversations 
WHERE 
  participant_ids IS NULL OR
  array_length(participant_ids, 1) = 0 OR
  max_participants IS NULL OR
  type IS NULL OR
  (type = 'direct' AND array_length(participant_ids, 1) != 2) OR
  (type = 'group' AND (array_length(participant_ids, 1) < 2 OR array_length(participant_ids, 1) > 5));

