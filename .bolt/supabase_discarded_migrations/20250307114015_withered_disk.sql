/*
  # Add User Creation Trigger and Function
  
  1. Changes
    - Add trigger function to create user profile on auth signup
    - Add trigger to sync email and create profile
    - Update RLS policies for better access control
  
  2. Security
    - Maintain RLS
    - Ensure proper user data access
*/

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to non-sensitive user data
CREATE POLICY "Allow public read access to users"
ON public.users FOR SELECT
TO public
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON public.users FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Allow service role full access"
ON public.users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);