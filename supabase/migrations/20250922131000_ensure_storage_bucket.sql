-- Create storage bucket for group chat images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'group-chat-images', 'group-chat-images', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'group-chat-images'
);

-- Set up storage policy for group chat images
CREATE POLICY "Group chat images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-chat-images');

-- Users can upload to their own folder
CREATE POLICY "Users can upload group chat images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'group-chat-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own images
CREATE POLICY "Users can update their own group chat images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'group-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'group-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Users can delete their own group chat images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'group-chat-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);