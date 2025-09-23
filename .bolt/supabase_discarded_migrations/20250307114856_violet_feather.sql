/*
  # Add email field to users table

  1. Changes
    - Add email column to users table
    - Add RLS policy to restrict email visibility (if not exists)
    - Add trigger to sync email from auth.users
    - Sync existing emails

  2. Security
    - Email is only visible to the user themselves and admins
    - Email is automatically synced from auth.users
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

-- Drop existing policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Users can view own email'
  ) THEN
    DROP POLICY "Users can view own email" ON users;
  END IF;
END $$;

-- Create policy to restrict email visibility
CREATE POLICY "Users can view own email"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (id = auth.uid()) OR 
    (EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.is_admin = true
    ))
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

-- Create trigger to sync email on user creation
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Sync existing emails
UPDATE users u
SET email = au.email
FROM auth.users au
WHERE u.id = au.id
AND (u.email IS NULL OR u.email != au.email);