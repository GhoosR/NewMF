-- Create storage bucket for chat files (voice messages, files, etc.)
-- This should be run in Supabase SQL editor or via migration

-- Create the chat-files bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 
  'chat-files',
  'chat-files',
  true,
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp3', 'audio/wav', 'audio/ogg', 'image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'chat-files'
);

-- Create RLS policies for the chat-files bucket
DROP POLICY IF EXISTS "Users can upload chat files" ON storage.objects;
CREATE POLICY "Users can upload chat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' 
  AND auth.uid()::text = (storage.foldername(name))[2] -- Check if user owns the folder
);

DROP POLICY IF EXISTS "Users can view chat files" ON storage.objects;
CREATE POLICY "Users can view chat files" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
CREATE POLICY "Users can delete their own chat files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'chat-files' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Create a function to clean up old voice messages (optional)
CREATE OR REPLACE FUNCTION cleanup_old_voice_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete voice messages older than 30 days
  DELETE FROM messages 
  WHERE message_type = 'voice' 
  AND created_at < NOW() - INTERVAL '30 days';
  
  -- Note: You might also want to delete the actual files from storage
  -- This would require additional logic to clean up the storage bucket
END;
$$;

-- Create a scheduled job to run cleanup (if using pg_cron extension)
-- SELECT cron.schedule('cleanup-voice-messages', '0 2 * * *', 'SELECT cleanup_old_voice_messages();');
