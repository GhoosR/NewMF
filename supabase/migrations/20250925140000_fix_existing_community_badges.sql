-- Fix existing Community Builder badges to have proper metadata structure

-- Update existing Community Builder badges to include communities array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'communities', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'community_id', c.id,
        'community_name', c.name
      )
    )
    FROM communities c
    WHERE c.owner_id = user_badges.user_id
  ),
  'primary_community_id', 
  (
    SELECT c.id
    FROM communities c
    WHERE c.owner_id = user_badges.user_id
    ORDER BY c.created_at ASC
    LIMIT 1
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'community_builder'
)
AND metadata IS NULL OR metadata = '{}'::jsonb;

-- Also update badges that have old metadata structure
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'communities', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'community_id', c.id,
        'community_name', c.name
      )
    )
    FROM communities c
    WHERE c.owner_id = user_badges.user_id
  ),
  'primary_community_id', 
  COALESCE(
    metadata->>'primary_community_id',
    (
      SELECT c.id::text
      FROM communities c
      WHERE c.owner_id = user_badges.user_id
      ORDER BY c.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'community_builder'
)
AND metadata ? 'community_id' OR metadata ? 'community_name';

-- Remove old single community metadata and replace with communities array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'communities', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'community_id', c.id,
        'community_name', c.name
      )
    )
    FROM communities c
    WHERE c.owner_id = user_badges.user_id
  ),
  'primary_community_id', 
  COALESCE(
    metadata->>'primary_community_id',
    (
      SELECT c.id::text
      FROM communities c
      WHERE c.owner_id = user_badges.user_id
      ORDER BY c.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'community_builder'
)
AND (metadata ? 'community_id' OR metadata ? 'community_name' OR metadata ? 'earned_for_community');





