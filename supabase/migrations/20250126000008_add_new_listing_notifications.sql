-- Create function to notify admins when new listings are submitted
CREATE OR REPLACE FUNCTION notify_admins_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_listing_type text;
  v_listing_title text;
  v_user_username text;
BEGIN
  -- Determine listing type and title based on table
  CASE TG_TABLE_NAME
    WHEN 'practitioners' THEN
      v_listing_type := 'practitioner';
      v_listing_title := NEW.title;
    WHEN 'events' THEN
      v_listing_type := 'event';
      v_listing_title := NEW.title;
    WHEN 'venues' THEN
      v_listing_type := 'venue';
      v_listing_title := NEW.name;
    WHEN 'job_offers' THEN
      v_listing_type := 'job';
      v_listing_title := NEW.title;
    WHEN 'courses' THEN
      v_listing_type := 'course';
      v_listing_title := NEW.title;
    WHEN 'recipes' THEN
      v_listing_type := 'recipe';
      v_listing_title := NEW.title;
    ELSE
      RETURN NEW;
  END CASE;

  -- Get the username of the user who created the listing
  SELECT username INTO v_user_username
  FROM users
  WHERE id = NEW.user_id;

  -- Create notifications for all admins
  FOR v_admin_id IN 
    SELECT id FROM users WHERE is_admin = true
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_admin_id,
      'new_listing',
      'New ' || v_listing_type || ' listing submitted',
      COALESCE(v_user_username, 'A user') || ' submitted a new ' || v_listing_type || ' listing: "' || v_listing_title || '"',
      jsonb_build_object(
        'listing_id', NEW.id,
        'listing_type', v_listing_type,
        'listing_title', v_listing_title,
        'user_id', NEW.user_id,
        'user_username', v_user_username
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create triggers for each listing table
DROP TRIGGER IF EXISTS notify_admins_new_practitioner ON practitioners;
CREATE TRIGGER notify_admins_new_practitioner
  AFTER INSERT ON practitioners
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();

DROP TRIGGER IF EXISTS notify_admins_new_event ON events;
CREATE TRIGGER notify_admins_new_event
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();

DROP TRIGGER IF EXISTS notify_admins_new_venue ON venues;
CREATE TRIGGER notify_admins_new_venue
  AFTER INSERT ON venues
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();

DROP TRIGGER IF EXISTS notify_admins_new_job ON job_offers;
CREATE TRIGGER notify_admins_new_job
  AFTER INSERT ON job_offers
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();

DROP TRIGGER IF EXISTS notify_admins_new_course ON courses;
CREATE TRIGGER notify_admins_new_course
  AFTER INSERT ON courses
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();

DROP TRIGGER IF EXISTS notify_admins_new_recipe ON recipes;
CREATE TRIGGER notify_admins_new_recipe
  AFTER INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_listing();










