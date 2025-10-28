-- Add onboarding columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'interests';

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

-- Add RLS policies for onboarding data (drop first if exists)
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON users;
CREATE POLICY "Users can update their own onboarding data" 
ON users 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users (onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_step ON users (onboarding_step);
