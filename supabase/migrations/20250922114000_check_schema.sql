-- Check type constraint
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'conversations'
  AND con.conname = 'conversations_type_check';

-- Check table columns and their types
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;




