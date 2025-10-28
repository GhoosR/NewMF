-- Add booking availability toggle to practitioners table
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS booking_available BOOLEAN DEFAULT true;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_practitioners_booking_available ON practitioners(booking_available);

-- Update the generate_availability_slots function to check booking availability
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
  v_booking_available BOOLEAN;
BEGIN
  -- Check if practitioner has booking availability enabled
  SELECT booking_available INTO v_booking_available
  FROM practitioners
  WHERE id = p_practitioner_id;
  
  -- If booking is not available, return empty
  IF NOT v_booking_available THEN
    RETURN;
  END IF;

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








