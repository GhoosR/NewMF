/*
  # Sync Auth Emails to Public Users

  1. Changes
    - Add email column to users table
    - Create trigger to sync emails from auth.users
    - Add RLS policy for email visibility
    - Sync existing emails

  2. Security
    - Emails only visible to own user and admins
    - Secure trigger function with SECURITY DEFINER
*/

-- Add email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'users' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email text;
  END IF;
END $$;

-- Create function to sync email
CREATE OR REPLACE FUNCTION public.sync_auth_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for email sync
DROP TRIGGER IF EXISTS sync_auth_user_email_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_email_trigger
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_email();

-- Add RLS policy for email visibility
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own email" ON public.users;
CREATE POLICY "Users can view own email"
  ON public.users
  FOR SELECT
  USING (
    (auth.uid() = id) OR 
    (
      SELECT is_admin FROM public.users WHERE id = auth.uid()
    )
  );

-- Sync existing emails
UPDATE public.users u
SET 
  email = au.email,
  updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
AND (u.email IS NULL OR u.email != au.email);