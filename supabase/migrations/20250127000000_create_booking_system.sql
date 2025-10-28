-- Create booking system tables
-- This migration creates the necessary tables for a comprehensive booking system

-- Create booking status enum
DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status booking_status DEFAULT 'pending',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  package_id UUID REFERENCES practitioner_packages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practitioner working hours table for default availability settings
CREATE TABLE IF NOT EXISTS practitioner_working_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_bookings_per_slot INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practitioner_id, day_of_week)
);

-- Create availability exceptions table for specific date overrides
CREATE TABLE IF NOT EXISTS practitioner_availability_exceptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN NOT NULL, -- false = completely unavailable, true = use default hours
  custom_start_time TIME, -- if provided, overrides default hours for this day
  custom_end_time TIME,   -- if provided, overrides default hours for this day
  custom_slot_duration_minutes INTEGER, -- if provided, overrides default slot duration
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practitioner_id, date)
);

-- Create availability table for practitioners to set their available times
CREATE TABLE IF NOT EXISTS practitioner_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(practitioner_id, date, start_time, end_time)
);

-- Create booking messages table for communication between practitioner and client
CREATE TABLE IF NOT EXISTS booking_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_practitioner_id ON bookings(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_availability_practitioner_id ON practitioner_availability(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_availability_date ON practitioner_availability(date);
CREATE INDEX IF NOT EXISTS idx_booking_messages_booking_id ON booking_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_practitioner_id ON practitioner_working_hours(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_working_hours_day ON practitioner_working_hours(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_practitioner_id ON practitioner_availability_exceptions(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_availability_exceptions_date ON practitioner_availability_exceptions(date);

-- Create function to update booking status and send notifications
CREATE OR REPLACE FUNCTION update_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_practitioner_name TEXT;
  v_client_name TEXT;
  v_practitioner_id UUID;
  v_client_id UUID;
BEGIN
  -- Get practitioner and client information
  SELECT 
    p.user_id,
    b.client_id,
    u1.full_name,
    u2.full_name
  INTO 
    v_practitioner_id,
    v_client_id,
    v_practitioner_name,
    v_client_name
  FROM bookings b
  JOIN practitioners p ON p.id = b.practitioner_id
  JOIN users u1 ON u1.id = p.user_id
  JOIN users u2 ON u2.id = b.client_id
  WHERE b.id = NEW.id;

  -- Send notification to client when practitioner updates booking status
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      v_client_id,
      'booking_status_update',
      'Booking Status Updated',
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Your booking with ' || v_practitioner_name || ' has been accepted!'
        WHEN NEW.status = 'declined' THEN 'Your booking with ' || v_practitioner_name || ' has been declined.'
        WHEN NEW.status = 'cancelled' THEN 'Your booking with ' || v_practitioner_name || ' has been cancelled.'
        ELSE 'Your booking status has been updated.'
      END,
      jsonb_build_object(
        'booking_id', NEW.id,
        'practitioner_id', v_practitioner_id,
        'status', NEW.status,
        'booking_date', NEW.booking_date,
        'start_time', NEW.start_time
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for booking status updates
DROP TRIGGER IF EXISTS booking_status_update_trigger ON bookings;
CREATE TRIGGER booking_status_update_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_status();

-- Create function to send notification when new booking is created
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_practitioner_id UUID;
  v_client_name TEXT;
BEGIN
  -- Get practitioner and client information
  SELECT 
    p.user_id,
    u.full_name
  INTO 
    v_practitioner_id,
    v_client_name
  FROM practitioners p
  JOIN users u ON u.id = NEW.client_id
  WHERE p.id = NEW.practitioner_id;

  -- Send notification to practitioner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_practitioner_id,
    'new_booking',
    'New Booking Request',
    v_client_name || ' has requested a booking with you.',
    jsonb_build_object(
      'booking_id', NEW.id,
      'client_id', NEW.client_id,
      'booking_date', NEW.booking_date,
      'start_time', NEW.start_time
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new booking notifications
DROP TRIGGER IF EXISTS new_booking_notification_trigger ON bookings;
CREATE TRIGGER new_booking_notification_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Create function to update availability when booking is accepted
CREATE OR REPLACE FUNCTION update_availability_on_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When booking is accepted, mark the time slot as unavailable
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE practitioner_availability 
    SET 
      is_available = false,
      current_bookings = current_bookings + 1
    WHERE 
      practitioner_id = NEW.practitioner_id
      AND date = NEW.booking_date
      AND start_time <= NEW.start_time
      AND end_time >= NEW.end_time;
  END IF;

  -- When booking is cancelled or declined, make the time slot available again
  IF (NEW.status = 'cancelled' OR NEW.status = 'declined') AND OLD.status = 'accepted' THEN
    UPDATE practitioner_availability 
    SET 
      is_available = true,
      current_bookings = GREATEST(0, current_bookings - 1)
    WHERE 
      practitioner_id = NEW.practitioner_id
      AND date = NEW.booking_date
      AND start_time <= NEW.start_time
      AND end_time >= NEW.end_time;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for availability updates
DROP TRIGGER IF EXISTS availability_update_trigger ON bookings;
CREATE TRIGGER availability_update_trigger
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_on_booking();

-- Create RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_availability_exceptions ENABLE ROW LEVEL SECURITY;

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = client_id OR auth.uid() = (SELECT user_id FROM practitioners WHERE id = practitioner_id));

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Practitioners can update their bookings" ON bookings;
CREATE POLICY "Practitioners can update their bookings" ON bookings
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM practitioners WHERE id = practitioner_id));

-- Availability policies
DROP POLICY IF EXISTS "Users can view practitioner availability" ON practitioner_availability;
CREATE POLICY "Users can view practitioner availability" ON practitioner_availability
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Practitioners can manage their availability" ON practitioner_availability;
CREATE POLICY "Practitioners can manage their availability" ON practitioner_availability
  FOR ALL USING (auth.uid() = (SELECT user_id FROM practitioners WHERE id = practitioner_id));

-- Booking messages policies
DROP POLICY IF EXISTS "Users can view booking messages" ON booking_messages;
CREATE POLICY "Users can view booking messages" ON booking_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT client_id FROM bookings WHERE id = booking_id
      UNION
      SELECT user_id FROM practitioners p 
      JOIN bookings b ON b.practitioner_id = p.id 
      WHERE b.id = booking_id
    )
  );

DROP POLICY IF EXISTS "Users can create booking messages" ON booking_messages;
CREATE POLICY "Users can create booking messages" ON booking_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT client_id FROM bookings WHERE id = booking_id
      UNION
      SELECT user_id FROM practitioners p 
      JOIN bookings b ON b.practitioner_id = p.id 
      WHERE b.id = booking_id
    )
  );

-- Working hours policies
DROP POLICY IF EXISTS "Users can view working hours" ON practitioner_working_hours;
CREATE POLICY "Users can view working hours" ON practitioner_working_hours
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Practitioners can manage their working hours" ON practitioner_working_hours;
CREATE POLICY "Practitioners can manage their working hours" ON practitioner_working_hours
  FOR ALL USING (auth.uid() = (SELECT user_id FROM practitioners WHERE id = practitioner_id));

-- Availability exceptions policies
DROP POLICY IF EXISTS "Users can view availability exceptions" ON practitioner_availability_exceptions;
CREATE POLICY "Users can view availability exceptions" ON practitioner_availability_exceptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Practitioners can manage their availability exceptions" ON practitioner_availability_exceptions;
CREATE POLICY "Practitioners can manage their availability exceptions" ON practitioner_availability_exceptions
  FOR ALL USING (auth.uid() = (SELECT user_id FROM practitioners WHERE id = practitioner_id));

-- Create function to get practitioner availability for a date range
CREATE OR REPLACE FUNCTION get_practitioner_availability(
  p_practitioner_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  max_bookings INTEGER,
  current_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.date,
    pa.start_time,
    pa.end_time,
    pa.is_available,
    pa.max_bookings,
    pa.current_bookings
  FROM practitioner_availability pa
  WHERE 
    pa.practitioner_id = p_practitioner_id
    AND pa.date BETWEEN p_start_date AND p_end_date
  ORDER BY pa.date, pa.start_time;
END;
$$;

-- Always compute availability from working hours/exceptions + live bookings
DROP FUNCTION IF EXISTS is_time_slot_available(UUID, DATE, TIME, TIME);
CREATE OR REPLACE FUNCTION is_time_slot_available(
  p_practitioner_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot RECORD;
  v_overlap_count INTEGER := 0;
BEGIN
  -- 1) Generate slots for the day and find the requested one
  SELECT * INTO v_slot
  FROM generate_availability_slots(p_practitioner_id, p_date) s
  WHERE s.start_time = p_start_time AND s.end_time = p_end_time;

  IF NOT FOUND THEN
    RETURN FALSE; -- no such slot for this day
  END IF;

  -- 2) If slot is marked not available, short-circuit
  IF NOT v_slot.is_available THEN
    RETURN FALSE;
  END IF;

  -- 3) Double-check overlapping bookings with pending/accepted status
  SELECT COUNT(*) INTO v_overlap_count
  FROM bookings b
  WHERE b.practitioner_id = p_practitioner_id
    AND b.booking_date = p_date
    AND b.status IN ('pending', 'accepted')
    AND NOT (b.end_time <= p_start_time OR b.start_time >= p_end_time);

  IF v_overlap_count >= COALESCE(v_slot.max_bookings, 1) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- Drop function if exists to avoid conflicts
DROP FUNCTION IF EXISTS generate_availability_slots(UUID, DATE);

-- Create function to generate availability slots based on working hours
CREATE OR REPLACE FUNCTION generate_availability_slots(
  p_practitioner_id UUID,
  p_date DATE
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN,
  max_bookings INTEGER,
  current_bookings INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_working_hours RECORD;
  v_exception RECORD;
  v_current_time TIME;
  v_slot_end_time TIME;
  v_slot_duration INTEGER;
  v_max_bookings INTEGER;
  v_current_bookings INTEGER;
BEGIN
  -- Get day of week (0=Sunday, 1=Monday, etc.)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Debug: Log the day of week calculation
  RAISE NOTICE 'Date: %, Day of week: %', p_date, v_day_of_week;
  
  -- Check for date-specific exception
  SELECT * INTO v_exception
  FROM practitioner_availability_exceptions
  WHERE practitioner_id = p_practitioner_id AND date = p_date;
  
  -- If there's an exception and the day is marked as unavailable
  IF FOUND AND NOT v_exception.is_available THEN
    RETURN; -- No slots available
  END IF;
  
  -- Get working hours for this day of week
  SELECT * INTO v_working_hours
  FROM practitioner_working_hours
  WHERE practitioner_id = p_practitioner_id 
    AND day_of_week = v_day_of_week 
    AND is_active = true;
  
  -- If no working hours set for this day, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Use exception overrides if available
  IF FOUND AND v_exception.is_available THEN
    IF v_exception.custom_start_time IS NOT NULL THEN
      v_working_hours.start_time := v_exception.custom_start_time;
    END IF;
    IF v_exception.custom_end_time IS NOT NULL THEN
      v_working_hours.end_time := v_exception.custom_end_time;
    END IF;
    IF v_exception.custom_slot_duration_minutes IS NOT NULL THEN
      v_working_hours.slot_duration_minutes := v_exception.custom_slot_duration_minutes;
    END IF;
  END IF;
  
  -- Generate slots
  v_current_time := v_working_hours.start_time;
  v_slot_duration := v_working_hours.slot_duration_minutes;
  v_max_bookings := v_working_hours.max_bookings_per_slot;
  v_current_bookings := 0;
  
  WHILE v_current_time < v_working_hours.end_time LOOP
    v_slot_end_time := v_current_time + INTERVAL '1 minute' * v_slot_duration;
    
    -- Check if slot would go beyond working hours
    IF v_slot_end_time > v_working_hours.end_time THEN
      EXIT;
    END IF;
    
    -- Count existing bookings for this exact time slot
    SELECT COUNT(*) INTO v_current_bookings
    FROM bookings b
    WHERE b.practitioner_id = p_practitioner_id
      AND b.booking_date = p_date
      AND b.start_time = v_current_time
      AND b.end_time = v_slot_end_time
      AND b.status IN ('pending', 'accepted');
    
    RETURN QUERY SELECT 
      v_current_time,
      v_slot_end_time,
      (v_current_bookings < v_max_bookings) as is_available,
      v_max_bookings,
      v_current_bookings;
    
    v_current_time := v_slot_end_time;
  END LOOP;
END;
$$;
