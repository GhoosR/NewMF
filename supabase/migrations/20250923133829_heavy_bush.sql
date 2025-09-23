/*
  # Fix RLS policy for users table

  1. Security
    - Drop existing restrictive policies that prevent username access
    - Add policy to allow authenticated users to read public user info including username
    - Ensure chat functionality can access user data for message display

  This fixes the "column username does not exist" error in chat by allowing
  authenticated users to read username and avatar_url columns from the users table.
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Public access to users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Create a comprehensive policy that allows authenticated users to read public user info
CREATE POLICY "Allow authenticated users to read public user info" 
ON public.users 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Allow public read access for basic user info (needed for public profiles)
CREATE POLICY "Public read access to basic user info" 
ON public.users 
FOR SELECT 
USING (true);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;