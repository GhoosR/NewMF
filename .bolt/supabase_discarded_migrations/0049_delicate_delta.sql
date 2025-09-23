-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('listing-images', 'listing-images', true),
  ('certifications', 'certifications', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload certifications" ON storage.objects;
  DROP POLICY IF EXISTS "Users can access own certifications" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Public access to listing images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Listing images are publicly accessible'
  ) THEN
    CREATE POLICY "Listing images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-images');
  END IF;

  -- Upload listing images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload listing images'
  ) THEN
    CREATE POLICY "Users can upload listing images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'listing-images' AND
      (storage.foldername(name))[1] = 'practitioners' AND
      (storage.foldername(name))[2] = auth.uid()::text
    );
  END IF;

  -- Upload certifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload certifications'
  ) THEN
    CREATE POLICY "Users can upload certifications"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'certifications' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Access own certifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can access own certifications'
  ) THEN
    CREATE POLICY "Users can access own certifications"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'certifications' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;