-- Create badge system tables and Community Builder badge

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  icon_url text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  criteria text NOT NULL, -- Description of how to earn the badge
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_badges table (junction table)
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}', -- Store additional data like which community for Community Builder
  is_displayed boolean DEFAULT false, -- Only one badge can be displayed at a time
  UNIQUE(user_id, badge_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_displayed ON user_badges(user_id, is_displayed) WHERE is_displayed = true;

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for badges (public read)
DROP POLICY IF EXISTS "Badges are publicly readable" ON badges;
CREATE POLICY "Badges are publicly readable" ON badges
  FOR SELECT USING (true);

-- Create RLS policies for user_badges
DROP POLICY IF EXISTS "User badges are publicly readable" ON user_badges;
CREATE POLICY "User badges are publicly readable" ON user_badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage their own badges" ON user_badges;
CREATE POLICY "Users can manage their own badges" ON user_badges
  FOR ALL USING (auth.uid() = user_id);

-- Insert the Community Builder badge (if it doesn't exist)
INSERT INTO badges (name, display_name, description, icon_url, category, criteria) 
SELECT 'community_builder', 'Community Builder', 'Created a community and brought people together', 
       'https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/communitybuilder.png',
       'community', 'Create your first community'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'community_builder');

-- Drop existing triggers and functions if they exist
DROP TRIGGER IF EXISTS award_community_builder_badge_trigger ON communities;
DROP TRIGGER IF EXISTS remove_community_builder_badge_trigger ON communities;
DROP TRIGGER IF EXISTS ensure_single_displayed_badge_trigger ON user_badges;

-- Create function to award Community Builder badge
CREATE OR REPLACE FUNCTION award_community_builder_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  existing_badge user_badges%ROWTYPE;
BEGIN
  -- Get the Community Builder badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'community_builder';

  -- Check if user already has this badge
  SELECT * INTO existing_badge
  FROM user_badges
  WHERE user_id = NEW.owner_id
    AND badge_id = badge_record.id;

  -- If user doesn't have the badge, award it
  IF existing_badge.id IS NULL THEN
    INSERT INTO user_badges (user_id, badge_id, metadata, is_displayed)
    VALUES (
      NEW.owner_id,
      badge_record.id,
      jsonb_build_object(
        'community_id', NEW.id,
        'community_name', NEW.name,
        'earned_for_community', NEW.name
      ),
      true -- Set as displayed badge (first badge earned)
    );
  ELSE
    -- User already has the badge, update metadata to include this community
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{communities}',
      COALESCE(metadata->'communities', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'community_id', NEW.id,
        'community_name', NEW.name
      ))
    )
    WHERE id = existing_badge.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to award Community Builder badge when community is created
CREATE TRIGGER award_community_builder_badge_trigger
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION award_community_builder_badge();

-- Create function to remove Community Builder badge when all communities are deleted
CREATE OR REPLACE FUNCTION remove_community_builder_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  remaining_communities_count integer;
BEGIN
  -- Get the Community Builder badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'community_builder';

  -- Count remaining communities for this user
  SELECT COUNT(*) INTO remaining_communities_count
  FROM communities
  WHERE owner_id = OLD.owner_id;

  -- If no communities remain, remove the Community Builder badge
  IF remaining_communities_count = 0 THEN
    DELETE FROM user_badges
    WHERE user_id = OLD.owner_id
      AND badge_id = badge_record.id;
  ELSE
    -- Update the badge metadata to remove the deleted community
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{communities}',
      (
        SELECT jsonb_agg(community)
        FROM jsonb_array_elements(metadata->'communities') AS community
        WHERE community->>'community_id' != OLD.id::text
      )
    )
    WHERE user_id = OLD.owner_id
      AND badge_id = badge_record.id
      AND metadata ? 'communities';
  END IF;

  RETURN OLD;
END;
$$;

-- Create trigger to remove Community Builder badge when community is deleted
CREATE TRIGGER remove_community_builder_badge_trigger
  AFTER DELETE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION remove_community_builder_badge();

-- Create function to ensure only one badge is displayed per user
CREATE OR REPLACE FUNCTION ensure_single_displayed_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If setting a badge as displayed, unset all other displayed badges for this user
  IF NEW.is_displayed = true THEN
    UPDATE user_badges
    SET is_displayed = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to ensure only one badge is displayed
CREATE TRIGGER ensure_single_displayed_badge_trigger
  BEFORE INSERT OR UPDATE ON user_badges
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_displayed_badge();

-- Create function to get user's displayed badge with metadata
CREATE OR REPLACE FUNCTION get_user_displayed_badge(user_uuid uuid)
RETURNS TABLE (
  badge_id uuid,
  badge_name text,
  display_name text,
  description text,
  icon_url text,
  category text,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.display_name,
    b.description,
    b.icon_url,
    b.category,
    ub.metadata
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = user_uuid
    AND ub.is_displayed = true
  LIMIT 1;
END;
$$;

-- Create function to get all user badges
CREATE OR REPLACE FUNCTION get_user_badges(user_uuid uuid)
RETURNS TABLE (
  badge_id uuid,
  badge_name text,
  display_name text,
  description text,
  icon_url text,
  category text,
  earned_at timestamptz,
  metadata jsonb,
  is_displayed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.display_name,
    b.description,
    b.icon_url,
    b.category,
    ub.earned_at,
    ub.metadata,
    ub.is_displayed
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = user_uuid
  ORDER BY ub.earned_at DESC;
END;
$$;
