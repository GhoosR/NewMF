/*
  # Add missing username column to users table

  1. New Columns
    - `username` (text, unique, not null)
      - Required for chat functionality and user identification
      - Will be populated with default values for existing users
      - Must be unique across all users

  2. Data Migration
    - Generate usernames for existing users based on their ID
    - Ensure all usernames are unique and not null

  3. Constraints
    - Add unique constraint on username
    - Add not null constraint on username
*/

-- First, add the username column as nullable
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username text;

-- Update existing users with default usernames based on their ID
UPDATE public.users 
SET username = 'user_' || substring(id::text, 1, 8)
WHERE username IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_username_key' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);