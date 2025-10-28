-- Add slug fields to all listing tables for SEO-friendly URLs

-- Add slug columns to all listing tables
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS slug text;

-- Create indexes on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_practitioners_slug ON practitioners(slug);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_venues_slug ON venues(slug);
CREATE INDEX IF NOT EXISTS idx_job_offers_slug ON job_offers(slug);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);

-- Create function to generate unique slugs for any table
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
  -- Create base slug from title
  base_slug := lower(regexp_replace(title, '[^a-z0-9]+', '-', 'g'));
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

-- Create trigger function to auto-generate slugs for new listings
CREATE OR REPLACE FUNCTION set_listing_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only set slug if it's not already provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_unique_slug(TG_TABLE_NAME, NEW.title, NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for each listing table
DROP TRIGGER IF EXISTS set_practitioner_slug_trigger ON practitioners;
CREATE TRIGGER set_practitioner_slug_trigger
  BEFORE INSERT OR UPDATE ON practitioners
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

DROP TRIGGER IF EXISTS set_event_slug_trigger ON events;
CREATE TRIGGER set_event_slug_trigger
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

DROP TRIGGER IF EXISTS set_venue_slug_trigger ON venues;
CREATE TRIGGER set_venue_slug_trigger
  BEFORE INSERT OR UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

DROP TRIGGER IF EXISTS set_job_slug_trigger ON job_offers;
CREATE TRIGGER set_job_slug_trigger
  BEFORE INSERT OR UPDATE ON job_offers
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

DROP TRIGGER IF EXISTS set_course_slug_trigger ON courses;
CREATE TRIGGER set_course_slug_trigger
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_slug();

-- Update existing listings to have slugs
UPDATE practitioners 
SET slug = generate_unique_slug('practitioners', title, id)
WHERE slug IS NULL OR slug = '';

UPDATE events 
SET slug = generate_unique_slug('events', title, id)
WHERE slug IS NULL OR slug = '';

UPDATE venues 
SET slug = generate_unique_slug('venues', name, id)
WHERE slug IS NULL OR slug = '';

UPDATE job_offers 
SET slug = generate_unique_slug('job_offers', title, id)
WHERE slug IS NULL OR slug = '';

UPDATE courses 
SET slug = generate_unique_slug('courses', title, id)
WHERE slug IS NULL OR slug = '';

-- Make slug columns NOT NULL after populating existing records
ALTER TABLE practitioners ALTER COLUMN slug SET NOT NULL;
ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE venues ALTER COLUMN slug SET NOT NULL;
ALTER TABLE job_offers ALTER COLUMN slug SET NOT NULL;
ALTER TABLE courses ALTER COLUMN slug SET NOT NULL;

-- Add unique constraints on slug
ALTER TABLE practitioners ADD CONSTRAINT practitioners_slug_unique UNIQUE (slug);
ALTER TABLE events ADD CONSTRAINT events_slug_unique UNIQUE (slug);
ALTER TABLE venues ADD CONSTRAINT venues_slug_unique UNIQUE (slug);
ALTER TABLE job_offers ADD CONSTRAINT job_offers_slug_unique UNIQUE (slug);
ALTER TABLE courses ADD CONSTRAINT courses_slug_unique UNIQUE (slug);










