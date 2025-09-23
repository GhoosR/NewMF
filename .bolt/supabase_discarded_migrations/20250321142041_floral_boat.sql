/*
  # Remove Crop Calendar System

  1. Changes
    - Drop all crop-related tables
    - Drop related functions and triggers
    - Clean up any indexes and constraints
    - Handle non-existent objects gracefully
*/

DO $$ 
DECLARE
  _sql text;
BEGIN
  -- Drop functions first (they might depend on the tables)
  DROP FUNCTION IF EXISTS check_harvest_notifications() CASCADE;
  DROP FUNCTION IF EXISTS check_harvest_notifications_on_plant() CASCADE;
  DROP FUNCTION IF EXISTS handle_field_invitation() CASCADE;

  -- Drop tables in correct order
  DROP TABLE IF EXISTS harvests CASCADE;
  DROP TABLE IF EXISTS planted_crops CASCADE;
  DROP TABLE IF EXISTS field_invitations CASCADE;
  DROP TABLE IF EXISTS field_members CASCADE;
  DROP TABLE IF EXISTS fields CASCADE;

  -- Drop any remaining triggers explicitly
  FOR _sql IN 
    SELECT 'DROP TRIGGER IF EXISTS ' || tgname || ' ON ' || tbl || ' CASCADE;'
    FROM (
      SELECT DISTINCT tgname, event_object_table AS tbl
      FROM information_schema.triggers
      WHERE event_object_table IN ('planted_crops', 'field_invitations')
    ) AS t
  LOOP
    EXECUTE _sql;
  END LOOP;

EXCEPTION
  WHEN undefined_function OR undefined_table OR undefined_object THEN
    -- Object doesn't exist, continue
    NULL;
END $$;