-- Fix slug generation function to preserve first letters
-- This can be run directly on the database

-- Update the generate_unique_slug function to fix the regex pattern
CREATE OR REPLACE FUNCTION generate_unique_slug(table_name text, title text, exclude_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
  exists_query text;
  exists_count int;
BEGIN
  -- Create base slug from title - FIXED REGEX
  -- Changed from '[^a-z0-9]+' to '[^a-zA-Z0-9\s]+' to preserve letters and spaces
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]+', '-', 'g'));
  -- Replace spaces with hyphens
  base_slug := replace(base_slug, ' ', '-');
  -- Remove multiple consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'listing';
  END IF;
  
  final_slug := base_slug;
  
  -- Build dynamic query to check if slug exists
  IF exclude_id IS NULL THEN
    exists_query := format('SELECT COUNT(*) FROM %I WHERE slug = $1', table_name);
  ELSE
    exists_query := format('SELECT COUNT(*) FROM %I WHERE slug = $1 AND id != $2', table_name);
  END IF;
  
  -- Check if slug already exists and add counter if needed
  LOOP
    IF exclude_id IS NULL THEN
      EXECUTE exists_query INTO exists_count USING final_slug;
    ELSE
      EXECUTE exists_query INTO exists_count USING final_slug, exclude_id;
    END IF;
    
    EXIT WHEN exists_count = 0;
    
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Also fix the recipe slug generation function
CREATE OR REPLACE FUNCTION generate_recipe_slug(recipe_title text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Create base slug from recipe title - FIXED REGEX
  base_slug := lower(regexp_replace(recipe_title, '[^a-zA-Z0-9\s]+', '-', 'g'));
  -- Replace spaces with hyphens
  base_slug := replace(base_slug, ' ', '-');
  -- Remove multiple consecutive hyphens
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  -- Remove leading/trailing hyphens
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










