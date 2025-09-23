-- Drop chat-related tables and their dependencies
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Drop chat-related storage bucket
DO $$
BEGIN
  -- Drop storage policies
  DROP POLICY IF EXISTS "Public Access for chat-files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated Uploads for chat-files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own chat files" ON storage.objects;

  -- Delete all objects in the chat-files bucket
  DELETE FROM storage.objects WHERE bucket_id = 'chat-files';
  
  -- Delete the bucket
  DELETE FROM storage.buckets WHERE id = 'chat-files';
END $$;

-- Drop chat-related functions
DROP FUNCTION IF EXISTS arrays_equal(UUID[], UUID[]);
DROP FUNCTION IF EXISTS sorted_participants(UUID[]);
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID[], TEXT);