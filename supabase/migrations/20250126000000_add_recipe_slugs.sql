-- Add slug field to recipes table for SEO-friendly URLs

-- Add slug column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug text;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON recipes(slug);

-- Create function to generate unique slugs for recipes
CREATE OR REPLACE FUNCTION generate_recipe_slug(recipe_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from recipe title
  base_slug := lower(regexp_replace(recipe_title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'recipe';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug already exists and add counter if needed
  WHILE EXISTS (SELECT 1 FROM recipes WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger to auto-generate slugs for new recipes
CREATE OR REPLACE FUNCTION set_recipe_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set slug if it's not already provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_recipe_slug(NEW.title);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_recipe_slug_trigger ON recipes;

-- Create trigger to auto-generate slugs for new recipes
CREATE TRIGGER set_recipe_slug_trigger
  BEFORE INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION set_recipe_slug();

-- Update existing recipes to have slugs
UPDATE recipes 
SET slug = generate_recipe_slug(title)
WHERE slug IS NULL OR slug = '';

-- Make slug column NOT NULL after populating existing records
ALTER TABLE recipes ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE recipes ADD CONSTRAINT recipes_slug_unique UNIQUE (slug);



