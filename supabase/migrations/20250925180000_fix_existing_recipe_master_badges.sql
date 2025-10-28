-- Fix existing Recipe Master badges to have proper metadata structure

-- Update existing Recipe Master badges to include recipes array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'recipes', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'recipe_id', r.id,
        'recipe_name', r.title
      )
    )
    FROM recipes r
    WHERE r.user_id = user_badges.user_id
  ),
  'primary_recipe_id', 
  (
    SELECT r.id
    FROM recipes r
    WHERE r.user_id = user_badges.user_id
    ORDER BY r.created_at ASC
    LIMIT 1
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'recipe_master'
)
AND metadata IS NULL OR metadata = '{}'::jsonb;

-- Also update badges that have old metadata structure
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'recipes', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'recipe_id', r.id,
        'recipe_name', r.title
      )
    )
    FROM recipes r
    WHERE r.user_id = user_badges.user_id
  ),
  'primary_recipe_id', 
  COALESCE(
    metadata->>'primary_recipe_id',
    (
      SELECT r.id::text
      FROM recipes r
      WHERE r.user_id = user_badges.user_id
      ORDER BY r.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'recipe_master'
)
AND metadata ? 'recipe_id' OR metadata ? 'recipe_name';

-- Remove old single recipe metadata and replace with recipes array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'recipes', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'recipe_id', r.id,
        'recipe_name', r.title
      )
    )
    FROM recipes r
    WHERE r.user_id = user_badges.user_id
  ),
  'primary_recipe_id', 
  COALESCE(
    metadata->>'primary_recipe_id',
    (
      SELECT r.id::text
      FROM recipes r
      WHERE r.user_id = user_badges.user_id
      ORDER BY r.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'recipe_master'
)
AND (metadata ? 'recipe_id' OR metadata ? 'recipe_name' OR metadata ? 'earned_for_recipe');





