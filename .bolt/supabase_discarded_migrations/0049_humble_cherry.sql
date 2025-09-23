-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view timeline comments" ON timeline_post_comments;
  DROP POLICY IF EXISTS "Authenticated users can create timeline comments" ON timeline_post_comments;
  DROP POLICY IF EXISTS "Users can update own timeline comments" ON timeline_post_comments;
  DROP POLICY IF EXISTS "Users can delete own timeline comments" ON timeline_post_comments;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create table if it doesn't exist
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS timeline_post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES timeline_posts(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES timeline_post_comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE timeline_post_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
DO $$ 
BEGIN
  CREATE INDEX IF NOT EXISTS idx_timeline_post_comments_post_id 
  ON timeline_post_comments(post_id);

  CREATE INDEX IF NOT EXISTS idx_timeline_post_comments_parent_id 
  ON timeline_post_comments(parent_id);

  CREATE INDEX IF NOT EXISTS idx_timeline_post_comments_user_id 
  ON timeline_post_comments(user_id);
END $$;

-- Create new policies with unique names
CREATE POLICY "timeline_comments_select_v1"
  ON timeline_post_comments FOR SELECT
  USING (true);

CREATE POLICY "timeline_comments_insert_v1"
  ON timeline_post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timeline_comments_update_v1"
  ON timeline_post_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "timeline_comments_delete_v1"
  ON timeline_post_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);