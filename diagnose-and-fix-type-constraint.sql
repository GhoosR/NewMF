-- Diagnose and fix the conversations_type_check constraint issue
-- This will help us understand what's preventing group chat creation

-- STEP 1: Check what constraints exist on the conversations table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conversations'::regclass
ORDER BY conname;

-- STEP 2: Check the current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- STEP 3: Check what values are currently allowed for the type column
SELECT DISTINCT type, COUNT(*) as count
FROM conversations 
GROUP BY type;

-- STEP 4: Check if there are any existing conversations
SELECT COUNT(*) as total_conversations FROM conversations;

-- STEP 5: Try to see what the type constraint actually allows
-- This will help us understand what values are permitted
SELECT 
  'Current type constraint allows:' as info,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'conversations'::regclass 
AND conname = 'conversations_type_check';

-- STEP 6: Check if we need to add a slug/URL system for group chats
-- Let's see if there's already a slug or URL field
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'conversations' 
AND (column_name LIKE '%slug%' OR column_name LIKE '%url%' OR column_name LIKE '%identifier%');

