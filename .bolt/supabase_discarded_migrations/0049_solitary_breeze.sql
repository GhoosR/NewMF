-- Users Profile Extension
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      full_name TEXT,
      bio TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  END IF;
END $$;

-- Practitioners
CREATE TABLE IF NOT EXISTS practitioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  specialties TEXT[] NOT NULL,
  description TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  price DECIMAL(10,2),
  max_participants INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Venues
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  amenities TEXT[] NOT NULL,
  capacity INTEGER,
  price_per_hour DECIMAL(10,2),
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Job Offers
CREATE TABLE IF NOT EXISTS job_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL,
  salary_range TEXT,
  requirements TEXT[] NOT NULL,
  contact_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
DO $$ 
BEGIN
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE practitioners ENABLE ROW LEVEL SECURITY;
  ALTER TABLE events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
  ALTER TABLE job_offers ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all profiles" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Anyone can view practitioners" ON practitioners;
  DROP POLICY IF EXISTS "Users can create practitioner listings" ON practitioners;
  DROP POLICY IF EXISTS "Users can update own practitioner listings" ON practitioners;
  DROP POLICY IF EXISTS "Anyone can view events" ON events;
  DROP POLICY IF EXISTS "Users can create events" ON events;
  DROP POLICY IF EXISTS "Users can update own events" ON events;
  DROP POLICY IF EXISTS "Anyone can view venues" ON venues;
  DROP POLICY IF EXISTS "Users can create venues" ON venues;
  DROP POLICY IF EXISTS "Users can update own venues" ON venues;
  DROP POLICY IF EXISTS "Anyone can view job offers" ON job_offers;
  DROP POLICY IF EXISTS "Users can create job offers" ON job_offers;
  DROP POLICY IF EXISTS "Users can update own job offers" ON job_offers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Users Policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Practitioners Policies
CREATE POLICY "Anyone can view practitioners"
  ON practitioners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create practitioner listings"
  ON practitioners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practitioner listings"
  ON practitioners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Events Policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Venues Policies
CREATE POLICY "Anyone can view venues"
  ON venues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Job Offers Policies
CREATE POLICY "Anyone can view job offers"
  ON job_offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create job offers"
  ON job_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job offers"
  ON job_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);