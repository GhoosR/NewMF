-- Drop existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Authenticated users can create timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Users can update own timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Users can delete own timeline posts" ON timeline_posts;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create table if it doesn't exist
DO $$ 
BEGIN
  CREATE TABLE IF NOT EXISTS timeline_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE timeline_posts ENABLE ROW LEVEL SECURITY;

-- Create new policies with unique names
CREATE POLICY "timeline_posts_select_v1"
  ON timeline_posts FOR SELECT
  USING (true);

CREATE POLICY "timeline_posts_insert_v1"
  ON timeline_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timeline_posts_update_v1"
  ON timeline_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "timeline_posts_delete_v1"
  ON timeline_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);