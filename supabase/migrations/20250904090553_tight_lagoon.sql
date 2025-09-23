/*
  # Add user activity tracking for online status

  1. New Tables
    - `user_activity`
      - `user_id` (uuid, primary key, references users)
      - `last_seen` (timestamp)
      - `is_online` (boolean)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_activity` table
    - Add policies for users to manage their own activity
    - Add policy for public read access to online status

  3. Functions
    - Function to update user activity
    - Function to mark users offline after inactivity
*/

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen timestamptz DEFAULT now(),
  is_online boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can update own activity"
  ON user_activity
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view online status"
  ON user_activity
  FOR SELECT
  TO public
  USING (true);

-- Function to update user activity
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_activity (user_id, last_seen, is_online, updated_at)
  VALUES (auth.uid(), now(), true, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_seen = now(),
    is_online = true,
    updated_at = now();
END;
$$;

-- Function to mark inactive users as offline
CREATE OR REPLACE FUNCTION mark_inactive_users_offline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_activity
  SET is_online = false, updated_at = now()
  WHERE last_seen < now() - interval '5 minutes'
    AND is_online = true;
END;
$$;