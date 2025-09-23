/*
  # Add storage bucket for group chat images

  Note: Instead of directly modifying storage tables, you need to:
  1. Go to Supabase Dashboard
  2. Navigate to Storage
  3. Click "Create new bucket"
  4. Name it "group-chat-images"
  5. Check "Public bucket" option
  6. Click Create bucket

  Then run this migration for the policies:
*/

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Group chat images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload group chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own group chat images" ON storage.objects;

-- Policy for reading group chat images (public)
CREATE POLICY "Group chat images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-chat-images');

-- Policy for uploading group chat images (authenticated users only)
CREATE POLICY "Users can upload group chat images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-chat-images' AND
  auth.role() = 'authenticated'
);

-- Policy for deleting group chat images (owner only)
CREATE POLICY "Users can delete their own group chat images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-chat-images' AND
  owner = auth.uid()
);