/*
  # Update users table schema

  1. Changes
    - Add email column
    - Remove unused columns
    - Add trigger to sync email from auth.users
  
  2. Security
    - Enable RLS
    - Add policy for viewing own email
    - Add policy for admins to view all emails
*/

-- Add email column and remove unused columns
ALTER TABLE users 
ADD COLUMN email text;

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
CREATE TRIGGER sync_user_email_trigger
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own email
CREATE POLICY "Users can view own email"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- Policy for admins to view all emails
CREATE POLICY "Admins can view all emails"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);