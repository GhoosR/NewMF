/*
  # Add blocked users functionality
  
  1. New Tables
    - `blocked_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User who blocked someone
      - `blocked_user_id` (uuid) - User who was blocked
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on blocked_users table
    - Add policy for users to manage their own blocks
*/

-- Create blocked users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, blocked_user_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'blocked_users' 
    AND policyname = 'Users can manage their own blocks'
  ) THEN
    DROP POLICY "Users can manage their own blocks" ON public.blocked_users;
  END IF;
END $$;

-- Create policy
CREATE POLICY "Users can manage their own blocks"
  ON public.blocked_users
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create index for faster lookups if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'blocked_users' 
    AND indexname = 'idx_blocked_users_user_blocked'
  ) THEN
    CREATE INDEX idx_blocked_users_user_blocked ON public.blocked_users(user_id, blocked_user_id);
  END IF;
END $$;

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