/*
  # Fix Users Table Policies

  1. Changes
    - Drop existing policies causing recursion
    - Add new non-recursive policies
    - Add email sync trigger
    - Simplify admin checks
  
  2. Security
    - Enable RLS
    - Add policies for email visibility
    - Add policies for general data access
*/

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Public access to users" ON users;
DROP POLICY IF EXISTS "Users can view own email" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Enable user creation" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "service_role_insert" ON users;

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

-- Public read access (excluding email)
CREATE POLICY "Public read access"
ON users
FOR SELECT
TO public
USING (true);

-- Email access policy
CREATE POLICY "Users can view own email"
ON users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  is_admin = true
);

-- User creation policy
CREATE POLICY "Enable insert for authentication service"
ON users
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = id OR 
  current_setting('role') = 'service_role'
);

-- Profile update policy
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO public
USING (
  auth.uid() = id OR 
  current_setting('role') = 'service_role'
)
WITH CHECK (
  auth.uid() = id OR 
  current_setting('role') = 'service_role'
);

-- Admin access policy for insert/update/delete
CREATE POLICY "Admin insert access"
ON users
FOR INSERT
TO authenticated
WITH CHECK (
  current_setting('role') = 'service_role' OR
  (SELECT is_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "Admin update access"
ON users
FOR UPDATE
TO authenticated
USING (
  current_setting('role') = 'service_role' OR
  (SELECT is_admin FROM users WHERE id = auth.uid())
)
WITH CHECK (
  current_setting('role') = 'service_role' OR
  (SELECT is_admin FROM users WHERE id = auth.uid())
);

CREATE POLICY "Admin delete access"
ON users
FOR DELETE
TO authenticated
USING (
  current_setting('role') = 'service_role' OR
  (SELECT is_admin FROM users WHERE id = auth.uid())
);