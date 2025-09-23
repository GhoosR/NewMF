-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view post likes" ON community_post_likes;
  DROP POLICY IF EXISTS "Users can like posts" ON community_post_likes;
  DROP POLICY IF EXISTS "Users can unlike posts" ON community_post_likes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create table if it doesn't exist
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS community_post_likes (
    post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "community_post_likes_view_v1"
  ON community_post_likes FOR SELECT
  USING (true);

CREATE POLICY "community_post_likes_insert_v1"
  ON community_post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_post_likes_delete_v1"
  ON community_post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);