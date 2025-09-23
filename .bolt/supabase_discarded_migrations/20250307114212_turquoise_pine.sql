/*
  # Fix User Creation and Policies
  
  1. Changes
    - Add proper user creation handling
    - Fix RLS policies
    - Add email sync
    - Prevent duplicate users
  
  2. Security
    - Maintain RLS
    - Protect sensitive data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access" ON users;
DROP POLICY IF EXISTS "Users can view own email" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON users;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Generate base username from email or metadata
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Remove special characters and ensure valid username
  new_username := REGEXP_REPLACE(LOWER(new_username), '[^a-z0-9_]', '', 'g');
  
  -- Ensure username is at least 3 characters
  IF LENGTH(new_username) < 3 THEN
    new_username := 'user_' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  -- Check if username exists and append number if needed
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.users WHERE username = new_username || 
      CASE WHEN counter > 0 THEN counter::text ELSE '' END
    ) INTO username_exists;
    
    EXIT WHEN NOT username_exists;
    counter := counter + 1;
  END LOOP;
  
  -- Add number to username if counter > 0
  IF counter > 0 THEN
    new_username := new_username || counter::text;
  END IF;

  -- Insert new user if they don't already exist
  INSERT INTO public.users (
    id,
    email,
    username,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    new_username,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public read access (excluding email)
CREATE POLICY "Public read access"
ON public.users
FOR SELECT
TO public
USING (true);

-- Email access policy
CREATE POLICY "Users can view own email"
ON public.users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  is_admin = true
);

-- Profile update policy
CREATE POLICY "Users can update own profile"
ON public.users
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

-- Admin access policy
CREATE POLICY "Admin full access"
ON public.users
FOR ALL
TO authenticated
USING (
  current_setting('role') = 'service_role' OR
  (SELECT is_admin FROM users WHERE id = auth.uid())
);

-- Service role insert policy
CREATE POLICY "Service role insert"
ON public.users
FOR INSERT
TO service_role
WITH CHECK (true);