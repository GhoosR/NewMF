/*
  # Add user onboarding system

  1. New Columns in users table:
    - `interests` (text[]) - Array of user interests/categories
    - `onboarding_completed` (boolean) - Track if user completed onboarding
    - `onboarding_step` (text) - Track current onboarding step

  2. Functions:
    - Function to update user interests
    - Function to mark onboarding as completed

  3. Policies:
    - Allow users to update their own onboarding data
*/

-- Add onboarding columns to users table
DO $$
BEGIN
    -- Add interests column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'interests') THEN
        ALTER TABLE users ADD COLUMN interests text[] DEFAULT '{}';
    END IF;
    
    -- Add onboarding_completed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_completed') THEN
        ALTER TABLE users ADD COLUMN onboarding_completed boolean DEFAULT false;
    END IF;
    
    -- Add onboarding_step column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'onboarding_step') THEN
        ALTER TABLE users ADD COLUMN onboarding_step text DEFAULT 'interests';
    END IF;
END $$;

-- Create function to update user interests
CREATE OR REPLACE FUNCTION update_user_interests(
    user_id uuid,
    new_interests text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users 
    SET 
        interests = new_interests,
        updated_at = now()
    WHERE id = user_id;
END;
$$;

-- Create function to complete onboarding
CREATE OR REPLACE FUNCTION complete_user_onboarding(
    user_id uuid,
    final_interests text[] DEFAULT NULL,
    avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users 
    SET 
        interests = COALESCE(final_interests, interests),
        avatar_url = COALESCE(avatar_url, avatar_url),
        onboarding_completed = true,
        onboarding_step = 'completed',
        updated_at = now()
    WHERE id = user_id;
END;
$$;

-- Create function to update onboarding step
CREATE OR REPLACE FUNCTION update_onboarding_step(
    user_id uuid,
    step text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users 
    SET 
        onboarding_step = step,
        updated_at = now()
    WHERE id = user_id;
END;
$$;

-- Add RLS policies for onboarding data
CREATE POLICY "Users can update their own onboarding data" 
ON users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users (onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users (onboarding_step);



