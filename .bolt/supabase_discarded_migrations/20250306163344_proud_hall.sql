/*
  # Add User Blocking System

  1. New Tables
    - `blocked_users`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `blocked_user_id` (uuid, references users) 
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policy for users to manage their blocks

  3. Indexes
    - Index on user_id and blocked_user_id for better query performance
*/

-- Drop existing table and policies if they exist
DROP TABLE IF EXISTS blocked_users CASCADE;

-- Create blocked_users table
CREATE TABLE blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT blocked_users_user_id_blocked_user_id_key UNIQUE (user_id, blocked_user_id)
);

-- Create index for better query performance
CREATE INDEX idx_blocked_users_user_blocked ON blocked_users (user_id, blocked_user_id);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policy for managing blocks
CREATE POLICY "manage_blocks_policy" ON blocked_users
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());