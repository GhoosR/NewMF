/*
  # Create courses table and policies

  1. New Tables
    - `courses` table if it doesn't exist
  2. Security
    - Enable RLS
    - Add policies for viewing and managing courses
  3. Indexes
    - Add performance indexes
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructor_id UUID REFERENCES users(id) NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
  DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
  DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;
  DROP POLICY IF EXISTS "Instructors can delete own courses" ON courses;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update own courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own courses"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = instructor_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_price ON courses(price);