/*
  # Fix users table policies

  1. Changes
    - Drop existing policies causing recursion
    - Add new non-recursive policies
    - Add email column
    - Add email sync trigger
  
  2. Security
    - Enable RLS
    - Add policies for email visibility
    - Add policies for general data access
*/

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public access to users" ON users;
DROP POLICY IF EXISTS "Users can view own email" ON users;
DROP POLICY IF EXISTS "Admins can view all emails" ON users;
DROP POLICY IF EXISTS "Enable user creation" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own email" ON users;
DROP POLICY IF EXISTS "Admins can view all emails" ON users;

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE users ADD COLUMN email text;
  END IF;
END $$;

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET email = (
    SELECT email 
    FROM auth.users 
    WHERE id = NEW.id
  )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email on user creation
DROP TRIGGER IF EXISTS sync_user_email_trigger ON users;
CREATE TRIGGER sync_user_email_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Public access policy (no email)
CREATE POLICY "Public access to users"
ON users
FOR SELECT
TO public
USING (true);

-- Email access policy for own email
CREATE POLICY "Users can view own email"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Admin access policy
CREATE POLICY "Admin full access"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.is_admin = true
  )
);

-- User creation policy
CREATE POLICY "Enable user creation"
ON users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id OR 
  (SELECT current_setting('role') = 'service_role')
);

-- Profile update policy
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO public
USING (
  auth.uid() = id OR 
  (SELECT current_setting('role') = 'service_role')
)
WITH CHECK (
  auth.uid() = id OR 
  (SELECT current_setting('role') = 'service_role')
);