-- Create bucket for venue images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Venue images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload venue images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own venue images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Public access to venue images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Venue images are publicly accessible'
  ) THEN
    CREATE POLICY "Venue images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'venue-images');
  END IF;

  -- Upload venue images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload venue images'
  ) THEN
    CREATE POLICY "Users can upload venue images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'venue-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Delete own venue images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete own venue images'
  ) THEN
    CREATE POLICY "Users can delete own venue images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'venue-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;