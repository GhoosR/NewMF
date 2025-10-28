-- Fix existing Field Master badges to have proper metadata structure

-- Update existing Field Master badges to include fields array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'fields', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'field_id', f.id,
        'field_name', f.name
      )
    )
    FROM fields f
    WHERE f.owner_id = user_badges.user_id
  ),
  'primary_field_id', 
  (
    SELECT f.id
    FROM fields f
    WHERE f.owner_id = user_badges.user_id
    ORDER BY f.created_at ASC
    LIMIT 1
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'field_master'
)
AND metadata IS NULL OR metadata = '{}'::jsonb;

-- Also update badges that have old metadata structure
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'fields', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'field_id', f.id,
        'field_name', f.name
      )
    )
    FROM fields f
    WHERE f.owner_id = user_badges.user_id
  ),
  'primary_field_id', 
  COALESCE(
    metadata->>'primary_field_id',
    (
      SELECT f.id::text
      FROM fields f
      WHERE f.owner_id = user_badges.user_id
      ORDER BY f.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'field_master'
)
AND metadata ? 'field_id' OR metadata ? 'field_name';

-- Remove old single field metadata and replace with fields array
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'fields', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'field_id', f.id,
        'field_name', f.name
      )
    )
    FROM fields f
    WHERE f.owner_id = user_badges.user_id
  ),
  'primary_field_id', 
  COALESCE(
    metadata->>'primary_field_id',
    (
      SELECT f.id::text
      FROM fields f
      WHERE f.owner_id = user_badges.user_id
      ORDER BY f.created_at ASC
      LIMIT 1
    )
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'field_master'
)
AND (metadata ? 'field_id' OR metadata ? 'field_name' OR metadata ? 'earned_for_field');
