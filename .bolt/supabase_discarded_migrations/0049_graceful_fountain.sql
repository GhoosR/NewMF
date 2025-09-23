-- Create bucket for chat attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Chat attachments are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with versioned names to avoid conflicts
CREATE POLICY "chat_attachments_select_v1"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "chat_attachments_insert_v1"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "chat_attachments_delete_v1"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);