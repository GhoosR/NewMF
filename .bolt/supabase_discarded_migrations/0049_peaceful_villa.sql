-- Create bucket for event images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own event images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Public access to event images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Event images are publicly accessible'
  ) THEN
    CREATE POLICY "Event images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-images');
  END IF;

  -- Upload event images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload event images'
  ) THEN
    CREATE POLICY "Users can upload event images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'event-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  -- Delete own event images
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can delete own event images'
  ) THEN
    CREATE POLICY "Users can delete own event images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'event-images' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;