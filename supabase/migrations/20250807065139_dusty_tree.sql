/*
  # Ensure Username Uniqueness

  1. Database Changes
    - Add unique constraint on username field
    - Handle any existing duplicate usernames by appending numbers
  
  2. Data Integrity
    - Preserve all existing user accounts
    - Ensure no username conflicts
    - Update any duplicates with sequential numbers
*/

-- First, handle any existing duplicate usernames
DO $$
DECLARE
    duplicate_record RECORD;
    counter INTEGER;
    new_username TEXT;
BEGIN
    -- Find and fix duplicate usernames
    FOR duplicate_record IN 
        SELECT username, array_agg(id ORDER BY created_at) as user_ids
        FROM users 
        WHERE username IS NOT NULL
        GROUP BY username 
        HAVING count(*) > 1
    LOOP
        counter := 1;
        
        -- Skip the first user (keep original username)
        FOR i IN 2..array_length(duplicate_record.user_ids, 1) LOOP
            LOOP
                new_username := duplicate_record.username || counter::text;
                
                -- Check if this new username already exists
                IF NOT EXISTS (SELECT 1 FROM users WHERE username = new_username) THEN
                    -- Update the duplicate user with the new username
                    UPDATE users 
                    SET username = new_username, updated_at = now()
                    WHERE id = duplicate_record.user_ids[i];
                    
                    RAISE NOTICE 'Updated duplicate username % to %', duplicate_record.username, new_username;
                    EXIT;
                END IF;
                
                counter := counter + 1;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Now add the unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_username_unique' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END $$;