/*
  # Add user blocking functionality

  1. New Tables
    - `blocked_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `blocked_user_id` (uuid, references users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `blocked_users` table
    - Add policy for users to manage their own blocks

  3. Functions
    - Add function to check if a user is blocked
*/

-- Create blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "manage_own_blocks"
  ON public.blocked_users
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS blocked_users_user_blocked_idx ON public.blocked_users(user_id, blocked_user_id);

-- Function to check if a user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_id uuid, blocked_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users
    WHERE (user_id = blocker_id AND blocked_user_id = blocked_id)
       OR (user_id = blocked_id AND blocked_user_id = blocker_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;