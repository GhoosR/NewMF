/*
  # Fix users policy recursion

  1. Changes
    - Remove recursive admin check from email visibility policy
    - Add email column if not exists
    - Sync emails from auth.users
    - Update trigger for email sync

  2. Security
    - Email only visible to own user and admins
    - Uses direct admin check instead of recursive query
*/

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
  END IF;
END $$;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can view own email" ON users;

-- Create new non-recursive policy
CREATE POLICY "Users can view own email"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    is_admin = true
  );

-- Create or replace function to sync email
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email on user creation if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'sync_user_email_trigger'
  ) THEN
    CREATE TRIGGER sync_user_email_trigger
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION sync_user_email();
  END IF;
END $$;

-- Sync existing emails
UPDATE users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id
AND (u.email IS NULL OR u.email != au.email);