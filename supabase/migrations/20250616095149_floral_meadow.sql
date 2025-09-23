/*
  # Create garden_layouts table

  1. New Tables
    - `garden_layouts`
      - `id` (uuid, primary key)
      - `field_id` (uuid, foreign key to fields)
      - `user_id` (uuid, foreign key to users)
      - `elements` (jsonb, stores garden layout elements)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `garden_layouts` table
    - Add policies for field owners and members to manage layouts
*/

-- Create garden_layouts table
CREATE TABLE IF NOT EXISTS garden_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  elements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_garden_layouts_field_id ON garden_layouts(field_id);
CREATE INDEX IF NOT EXISTS idx_garden_layouts_user_id ON garden_layouts(user_id);

-- Enable row level security
ALTER TABLE garden_layouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Field owners can manage garden layouts"
  ON garden_layouts
  USING (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = garden_layouts.field_id
      AND fields.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fields
      WHERE fields.id = garden_layouts.field_id
      AND fields.owner_id = auth.uid()
    )
  );

CREATE POLICY "Field members can view garden layouts"
  ON garden_layouts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM field_members
      WHERE field_members.field_id = garden_layouts.field_id
      AND field_members.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_garden_layouts_updated_at
  BEFORE UPDATE ON garden_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();