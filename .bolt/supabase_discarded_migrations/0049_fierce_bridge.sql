-- Drop existing policies first
DO $$ 
BEGIN
  -- Drop community member policies
  DROP POLICY IF EXISTS "Members can view other members" ON community_members;
  DROP POLICY IF EXISTS "Admins can manage members" ON community_members;
  DROP POLICY IF EXISTS "Anyone can view community members" ON community_members;
  DROP POLICY IF EXISTS "Owners and admins can manage members" ON community_members;

  -- Drop storage policies
  DROP POLICY IF EXISTS "Community images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload community images" ON storage.objects;
  DROP POLICY IF EXISTS "Post images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload post images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new, fixed policies for community_members
CREATE POLICY "Anyone can view community members"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Owners and admins can manage members"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_members AS cm
      WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND (cm.role = 'admin' OR EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_members.community_id
        AND communities.owner_id = auth.uid()
      ))
    )
  );

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('community-images', 'community-images', true),
  ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies with unique names
CREATE POLICY "community_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

CREATE POLICY "community_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "post_images_public_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "post_images_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);