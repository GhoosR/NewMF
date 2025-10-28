/*
  # Add community about support

  1. Updates to communities table:
    - Add about_text (text) for community description
    - Add team_members (jsonb) for team member information
    - Add about_images (text[]) for team photos

  2. Security:
    - Add RLS policies for community about information
*/

-- Add new columns to communities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'about_text') THEN
        ALTER TABLE communities ADD COLUMN about_text text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'team_members') THEN
        ALTER TABLE communities ADD COLUMN team_members jsonb DEFAULT '[]'::jsonb;
    END IF;
    
    -- about_images column removed - using user search instead
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_communities_about_text ON communities(about_text) WHERE about_text IS NOT NULL;

-- Note: RLS policies are not needed here as the communities table already has
-- proper RLS policies from previous migrations that handle access control.
-- Adding additional policies would cause infinite recursion.
