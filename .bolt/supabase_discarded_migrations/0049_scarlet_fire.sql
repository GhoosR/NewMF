-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create bucket for banners
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload banners" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies with existence checks
DO $$ 
BEGIN
  -- Create public access policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Banner images are publicly accessible'
  ) THEN
    CREATE POLICY "Banner images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');
  END IF;

  -- Create upload policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Users can upload banners'
  ) THEN
    CREATE POLICY "Users can upload banners"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'banners' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;