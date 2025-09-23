/*
  # Fix Practitioners Table Policies

  1. Changes
    - Add proper RLS policies for practitioners table
    - Enable public read access
    - Maintain secure write access
    
  2. Security
    - Anyone can view practitioners
    - Only authenticated users can create/update their own listings
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view practitioners" ON practitioners;
DROP POLICY IF EXISTS "Users can create practitioner listings" ON practitioners;
DROP POLICY IF EXISTS "Users can update own practitioner listings" ON practitioners;

-- Create new policies
CREATE POLICY "Anyone can view practitioners"
  ON practitioners FOR SELECT
  USING (true);

CREATE POLICY "Users can create practitioner listings"
  ON practitioners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practitioner listings"
  ON practitioners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_practitioners_user_id 
ON practitioners(user_id);

-- Enable RLS if not already enabled
ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;