/*
  # Fix conversation type constraint

  1. Changes
    - Remove restrictive check constraint that only allows 'direct' type
    - Add proper check constraint that allows both 'direct' and 'group' types
    - This enables group chat functionality

  2. Security
    - Maintains existing RLS policies
    - No changes to data access permissions
*/

-- Remove the restrictive constraint that only allows 'direct'
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add a proper constraint that allows both 'direct' and 'group'
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check 
  CHECK (type = ANY (ARRAY['direct'::text, 'group'::text]));