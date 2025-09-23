/*
  # Sync Auth Email to Public Users

  1. Changes
    - Add trigger to sync auth.users email to public.users table
    - Add function to handle email sync
    - Add email column to public.users table

  2. Security
    - Only service role can access auth.users table
    - Email column is protected by RLS
*/

-- Add email column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email text;

-- Create function to sync email
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER sync_auth_email_trigger
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Backfill existing emails
DO $$
BEGIN
  UPDATE public.users
  SET email = auth.email
  FROM auth.users auth
  WHERE users.id = auth.id
  AND users.email IS NULL;
END $$;