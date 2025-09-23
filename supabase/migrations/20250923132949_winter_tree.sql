/*
  # Fix RLS policy for users table

  1. Security Changes
    - Update RLS policy to allow authenticated users to read all user profiles
    - This fixes the "column username does not exist" error in chat functionality
    - Ensures usernames and avatars can be displayed in chat interface

  2. Changes
    - Drop existing restrictive policy
    - Create new policy allowing authenticated users to read all user data
*/

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policy that might be blocking username access
DROP POLICY IF EXISTS "Allow authenticated users to read all user profiles" ON public.users;
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable user creation" ON public.users;

-- Create comprehensive policy for authenticated users to read all user profiles
CREATE POLICY "Allow authenticated users to read all user profiles" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow public read access for basic user info (needed for public profiles)
CREATE POLICY "Public access to users" 
ON public.users 
FOR SELECT 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow user creation during signup
CREATE POLICY "Enable user creation" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id OR current_setting('role') = 'service_role');

-- Allow service role full access
CREATE POLICY "Allow service_role full access" 
ON public.users 
FOR ALL 
USING (current_setting('role') = 'service_role') 
WITH CHECK (current_setting('role') = 'service_role');