-- Update badge display names

-- Update Field Master to Green Fingers
UPDATE badges 
SET display_name = 'Green Fingers'
WHERE name = 'field_master';

-- Update Recipe Master to Community Chef
UPDATE badges 
SET display_name = 'Community Chef'
WHERE name = 'recipe_master';





