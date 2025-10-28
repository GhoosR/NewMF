-- Add Field Master badge for agriculture field creation

-- Insert the Field Master badge
INSERT INTO badges (name, display_name, description, icon_url, category, criteria) 
SELECT 'field_master', 'Field Master', 'Created your first agricultural field and started farming', 
       'https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/tractor-badge.png',
       'agriculture', 'Create your first agricultural field'
WHERE NOT EXISTS (SELECT 1 FROM badges WHERE name = 'field_master');

-- Create function to award Field Master badge
CREATE OR REPLACE FUNCTION award_field_master_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  existing_badge user_badges%ROWTYPE;
BEGIN
  -- Get the Field Master badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'field_master';

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
        'field_id', NEW.id,
        'field_name', NEW.name,
        'earned_for_field', NEW.name
      ),
      false -- Don't set as displayed by default (user can choose)
    );
  ELSE
    -- User already has the badge, update metadata to include this field
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{fields}',
      COALESCE(metadata->'fields', '[]'::jsonb) || 
      jsonb_build_array(jsonb_build_object(
        'field_id', NEW.id,
        'field_name', NEW.name
      ))
    )
    WHERE id = existing_badge.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS award_field_master_badge_trigger ON fields;

-- Create trigger to award Field Master badge when field is created
CREATE TRIGGER award_field_master_badge_trigger
  AFTER INSERT ON fields
  FOR EACH ROW
  EXECUTE FUNCTION award_field_master_badge();

-- Create function to remove Field Master badge when all fields are deleted
CREATE OR REPLACE FUNCTION remove_field_master_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  badge_record badges%ROWTYPE;
  remaining_fields_count integer;
BEGIN
  -- Get the Field Master badge
  SELECT * INTO badge_record
  FROM badges
  WHERE name = 'field_master';

  -- Count remaining fields for this user
  SELECT COUNT(*) INTO remaining_fields_count
  FROM fields
  WHERE owner_id = OLD.owner_id;

  -- If no fields remain, remove the Field Master badge
  IF remaining_fields_count = 0 THEN
    DELETE FROM user_badges
    WHERE user_id = OLD.owner_id
      AND badge_id = badge_record.id;
  ELSE
    -- Update the badge metadata to remove the deleted field
    UPDATE user_badges
    SET metadata = jsonb_set(
      metadata,
      '{fields}',
      (
        SELECT jsonb_agg(field)
        FROM jsonb_array_elements(metadata->'fields') AS field
        WHERE field->>'field_id' != OLD.id::text
      )
    )
    WHERE user_id = OLD.owner_id
      AND badge_id = badge_record.id
      AND metadata ? 'fields';
  END IF;

  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS remove_field_master_badge_trigger ON fields;

-- Create trigger to remove Field Master badge when field is deleted
CREATE TRIGGER remove_field_master_badge_trigger
  AFTER DELETE ON fields
  FOR EACH ROW
  EXECUTE FUNCTION remove_field_master_badge();
