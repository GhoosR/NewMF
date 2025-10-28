-- Update recipe badge metadata to include slugs

-- Update existing Recipe Master badges to include recipe slugs
UPDATE user_badges 
SET metadata = jsonb_build_object(
  'recipes', 
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'recipe_id', r.id,
        'recipe_name', r.title,
        'recipe_slug', r.slug
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
  ),
  'primary_recipe_slug',
  (
    SELECT r.slug
    FROM recipes r
    WHERE r.user_id = user_badges.user_id
    ORDER BY r.created_at ASC
    LIMIT 1
  )
)
WHERE badge_id = (
  SELECT id FROM badges WHERE name = 'recipe_master'
);

-- Update the badge trigger function to include slugs
CREATE OR REPLACE FUNCTION award_recipe_master_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  existing_badge user_badges%ROWTYPE;
BEGIN
  -- Get the Recipe Master badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'recipe_master';

  -- Check if user already has this badge
  SELECT * INTO existing_badge
  FROM user_badges
  WHERE user_id = NEW.user_id
    AND badge_id = badge_record.id;

  -- If user doesn't have the badge, award it
  IF existing_badge.id IS NULL THEN
    INSERT INTO user_badges (user_id, badge_id, metadata, is_displayed)
    VALUES (
      NEW.user_id,
      badge_record.id,
      jsonb_build_object(
        'recipe_id', NEW.id,
        'recipe_name', NEW.title,
        'recipe_slug', NEW.slug,
        'earned_for_recipe', NEW.title
      ),
      false -- Don't set as displayed by default (user can choose)
    );
  ELSE
    -- User already has the badge, update metadata to include this recipe
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{recipes}',
      COALESCE(metadata->'recipes', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'recipe_id', NEW.id,
        'recipe_name', NEW.title,
        'recipe_slug', NEW.slug
      ))
    )
    WHERE id = existing_badge.id;
  END IF;

  RETURN NEW;
END;
$$;



