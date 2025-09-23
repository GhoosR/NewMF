/*
  # Create livestream schedule table

  1. New Tables
    - `livestream_schedule`
      - `id` (uuid, primary key)
      - `day_of_week` (integer, 0-6 where 0 is Sunday)
      - `time` (time)
      - `title` (text)
      - `host` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `livestream_schedule` table
    - Add policy for public read access
    - Add policy for admin-only write access

  3. Indexes
    - Add index on day_of_week and time for efficient querying
*/

CREATE TABLE IF NOT EXISTS livestream_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time time NOT NULL,
  title text NOT NULL,
  host text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE livestream_schedule ENABLE ROW LEVEL SECURITY;

-- Public can view the schedule
CREATE POLICY "Anyone can view livestream schedule"
  ON livestream_schedule
  FOR SELECT
  TO public
  USING (true);

-- Only admins can manage the schedule
CREATE POLICY "Only admins can manage livestream schedule"
  ON livestream_schedule
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_livestream_schedule_day_time 
  ON livestream_schedule (day_of_week, time);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_livestream_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_livestream_schedule_updated_at
  BEFORE UPDATE ON livestream_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_livestream_schedule_updated_at();