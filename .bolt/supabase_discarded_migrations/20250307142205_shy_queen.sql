/*
  # Create users table with email field

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `banner_url` (text, nullable)
      - `bio` (text, nullable)
      - `user_type` (text, default 'member')
      - `subscription_status` (text, default 'inactive')
      - `stripe_customer_id` (text, nullable)
      - `stripe_connect_id` (text, nullable)
      - `stripe_connect_status` (text, nullable)
      - `is_admin` (boolean, default false)
      - `verified` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS
    - Add policies for public access and user management
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  banner_url text,
  bio text,
  user_type text DEFAULT 'member'::text,
  subscription_status text DEFAULT 'inactive'::text,
  stripe_customer_id text,
  stripe_connect_id text,
  stripe_connect_status text,
  is_admin boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT users_user_type_check CHECK (user_type IN ('member', 'professional')),
  CONSTRAINT users_subscription_status_check CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  CONSTRAINT users_stripe_connect_status_check CHECK (stripe_connect_status IN ('pending', 'connected', 'disconnected'))
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_verified ON users (verified);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_connect_id ON users (stripe_connect_id);

-- Create policies with unique names
CREATE POLICY "users_service_role_insert_policy"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "users_service_role_update_policy"
  ON users
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_service_role_delete_policy"
  ON users
  FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "users_public_insert_policy"
  ON users
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = id) OR (current_setting('role') = 'service_role'));

CREATE POLICY "users_public_select_policy"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "users_public_update_policy"
  ON users
  FOR UPDATE
  TO public
  USING ((auth.uid() = id) OR (current_setting('role') = 'service_role'))
  WITH CHECK (true);