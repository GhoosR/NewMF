-- Add Recipe Master badge for recipe creation

-- Insert the Recipe Master badge
INSERT INTO badges (name, display_name, description, icon_url, category, criteria) 
SELECT 'recipe_master', 'Recipe Master', 'Created your first recipe and shared your culinary skills', 
       'https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/chefhat-badge.png',
       'cooking', 'Create your first recipe'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'recipe_master');

-- Create function to award Recipe Master badge
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
        'recipe_name', NEW.title
      ))
    )
    WHERE id = existing_badge.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS award_recipe_master_badge_trigger ON recipes;

-- Create trigger to award Recipe Master badge when recipe is created
CREATE TRIGGER award_recipe_master_badge_trigger
  AFTER INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION award_recipe_master_badge();

-- Create function to remove Recipe Master badge when all recipes are deleted
CREATE OR REPLACE FUNCTION remove_recipe_master_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  remaining_recipes_count integer;
BEGIN
  -- Get the Recipe Master badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'recipe_master';

  -- Count remaining recipes for this user
  SELECT COUNT(*) INTO remaining_recipes_count
  FROM recipes
  WHERE user_id = OLD.user_id;

  -- If no recipes remain, remove the Recipe Master badge
  IF remaining_recipes_count = 0 THEN
    DELETE FROM user_badges
    WHERE user_id = OLD.user_id
      AND badge_id = badge_record.id;
  ELSE
    -- Update the badge metadata to remove the deleted recipe
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{recipes}',
      (
        SELECT jsonb_agg(recipe)
        FROM jsonb_array_elements(metadata->'recipes') AS recipe
        WHERE recipe->>'recipe_id' != OLD.id::text
      )
    )
    WHERE user_id = OLD.user_id
      AND badge_id = badge_record.id
      AND metadata ? 'recipes';
  END IF;

  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS remove_recipe_master_badge_trigger ON recipes;

-- Create trigger to remove Recipe Master badge when recipe is deleted
CREATE TRIGGER remove_recipe_master_badge_trigger
  AFTER DELETE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION remove_recipe_master_badge();





