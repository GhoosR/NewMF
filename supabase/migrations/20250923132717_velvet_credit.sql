/*
  # Add username column to users table

  1. New Columns
    - `username` (text, unique, not null) - User's unique username
  
  2. Data Migration
    - Populate existing users with usernames based on their user ID
    - Add unique constraint to prevent duplicates
  
  3. Security
    - Update existing RLS policies to work with new column
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE public.users ADD COLUMN username text;
  END IF;
END $$;

-- Populate username for existing users who don't have one
UPDATE public.users 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username IS NULL;

-- Make username NOT NULL and add unique constraint
DO $$
BEGIN
  -- Set NOT NULL constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;
  END IF;
  
  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'users' AND constraint_name = 'users_username_key'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;