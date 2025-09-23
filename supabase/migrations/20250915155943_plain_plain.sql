/*
  # Add crop tracking to field tasks

  1. New Columns
    - `crop_name` (text, optional) - Name of the crop being planted
  
  2. Indexes
    - Add index on crop_name for faster queries
    - Add composite index on field_id and crop_name
  
  3. Notes
    - This allows tracking specific crops when creating planting tasks
    - Enables harvest date calculations and garden overview
*/

-- Add crop_name column to field_tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'field_tasks' AND column_name = 'crop_name'
  ) THEN
    ALTER TABLE field_tasks ADD COLUMN crop_name text;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_field_tasks_crop_name ON field_tasks(crop_name);
CREATE INDEX IF NOT EXISTS idx_field_tasks_field_crop ON field_tasks(field_id, crop_name);