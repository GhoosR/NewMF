/*
  # Add timeline posts table with policy checks

  1. New Tables
    - `timeline_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `content` (text)
      - `images` (text array)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for post management with existence checks
    - Add foreign key constraint to users table
*/

-- Create timeline posts table
CREATE TABLE IF NOT EXISTS timeline_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE timeline_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Users can create timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Users can delete own timeline posts" ON timeline_posts;
  DROP POLICY IF EXISTS "Users can update own timeline posts" ON timeline_posts;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create policies
CREATE POLICY "Anyone can view timeline posts"
  ON timeline_posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create timeline posts"
  ON timeline_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own timeline posts"
  ON timeline_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own timeline posts"
  ON timeline_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_timeline_posts_updated_at ON timeline_posts;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

CREATE TRIGGER update_timeline_posts_updated_at
  BEFORE UPDATE ON timeline_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();