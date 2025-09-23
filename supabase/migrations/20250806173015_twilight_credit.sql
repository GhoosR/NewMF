/*
  # Add admin controls for live chat

  1. New Tables
    - `muted_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `muted_by` (uuid, foreign key to users - admin who muted)
      - `reason` (text, optional)
      - `created_at` (timestamp)

  2. Updates
    - Add `chat_enabled` column to `live_stream_settings` table

  3. Security
    - Enable RLS on `muted_users` table
    - Add policies for admin access only
*/

-- Add chat_enabled column to live_stream_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_stream_settings' AND column_name = 'chat_enabled'
  ) THEN
    ALTER TABLE live_stream_settings ADD COLUMN chat_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Create muted_users table
CREATE TABLE IF NOT EXISTS muted_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE muted_users ENABLE ROW LEVEL SECURITY;

-- Policies for muted_users
CREATE POLICY "Only admins can manage muted users"
  ON muted_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Policy to check if user is muted (for chat access)
CREATE POLICY "Users can check if they are muted"
  ON muted_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());