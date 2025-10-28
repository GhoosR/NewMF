import { supabase } from './supabase';
import type { 
  Booking, 
  PractitionerAvailability, 
  BookingMessage, 
  CreateBookingData, 
  UpdateAvailabilityData, 
  BookingFilters,
  AvailabilitySlot,
  BookingCalendarDay
} from '../types/bookings';

/**
 * Create a new booking
 */
export async function createBooking(bookingData: CreateBookingData): Promise<Booking> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if time slot is available
    const { data: isAvailable, error: checkError } = await supabase
      .rpc('is_time_slot_available', {
        p_practitioner_id: bookingData.practitioner_id,
        p_date: bookingData.booking_date,
        p_start_time: bookingData.start_time,
        p_end_time: bookingData.end_time
      });

    if (checkError) throw checkError;
    if (!isAvailable) throw new Error('Time slot is not available');

    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        ...bookingData,
        client_id: user.id
      }])
      .select(`
        *,
        practitioner:practitioners (
          id,
          title,
          user:users (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        client:users (
          id,
          username,
          full_name,
          avatar_url
        ),
        package:practitioner_packages (
          id,
          name,
          price,
          currency,
          description,
          features
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

/**
 * Get bookings with filters
 */
export async function getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('bookings')
      .select(`
        *,
        practitioner:practitioners (
          id,
          title,
          user:users (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        client:users (
          id,
          username,
          full_name,
          avatar_url
        ),
        package:practitioner_packages (
          id,
          name,
          price,
          currency,
          description,
          features
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('booking_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('booking_date', filters.date_to);
    }
    if (filters.practitioner_id) {
      query = query.eq('practitioner_id', filters.practitioner_id);
    }
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Get bookings for a specific practitioner
 */
export async function getPractitionerBookings(practitionerId: string): Promise<Booking[]> {
  return getBookings({ practitioner_id: practitionerId });
}

/**
 * Get bookings for the current user (as client)
 */
export async function getUserBookings(): Promise<Booking[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  return getBookings({ client_id: user.id });
}

/**
 * Update booking status
 */
export async function updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select(`
        *,
        practitioner:practitioners (
          id,
          title,
          user:users (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        client:users (
          id,
          username,
          full_name,
          avatar_url
        ),
        package:practitioner_packages (
          id,
          name,
          price,
          currency,
          description,
          features
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
}

/**
 * Get practitioner availability for a date range
 */
export async function getPractitionerAvailability(
  practitionerId: string, 
  startDate: string, 
  endDate: string
): Promise<PractitionerAvailability[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_practitioner_availability', {
        p_practitioner_id: practitionerId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching practitioner availability:', error);
    throw error;
  }
}

/**
 * Update practitioner availability
 */
export async function updatePractitionerAvailability(
  practitionerId: string,
  availabilityData: UpdateAvailabilityData
): Promise<PractitionerAvailability> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is the practitioner
    const { data: practitioner, error: practitionerError } = await supabase
      .from('practitioners')
      .select('user_id')
      .eq('id', practitionerId)
      .single();

    if (practitionerError || !practitioner) throw new Error('Practitioner not found');
    if (practitioner.user_id !== user.id) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('practitioner_availability')
      .upsert([{
        practitioner_id: practitionerId,
        ...availabilityData,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating practitioner availability:', error);
    throw error;
  }
}

/**
 * Get availability calendar for a practitioner
 */
export async function getAvailabilityCalendar(
  practitionerId: string,
  startDate: string,
  endDate: string
): Promise<BookingCalendarDay[]> {
  try {
    const availability = await getPractitionerAvailability(practitionerId, startDate, endDate);
    
    // Group availability by date
    const calendarMap = new Map<string, AvailabilitySlot[]>();
    
    availability.forEach(slot => {
      const date = slot.date;
      if (!calendarMap.has(date)) {
        calendarMap.set(date, []);
      }
      calendarMap.get(date)!.push({
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_available: slot.is_available,
        max_bookings: slot.max_bookings,
        current_bookings: slot.current_bookings
      });
    });

    // Convert to array format
    const calendar: BookingCalendarDay[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const slots = calendarMap.get(dateStr) || [];
      
      calendar.push({
        date: dateStr,
        slots,
        is_available: slots.some(slot => slot.is_available)
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  } catch (error) {
    console.error('Error fetching availability calendar:', error);
    throw error;
  }
}

/**
 * Get booking messages
 */
export async function getBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  try {
    const { data, error } = await supabase
      .from('booking_messages')
      .select(`
        *,
        sender:users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching booking messages:', error);
    throw error;
  }
}

/**
 * Send a message for a booking
 */
export async function sendBookingMessage(bookingId: string, message: string): Promise<BookingMessage> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('booking_messages')
      .insert([{
        booking_id: bookingId,
        sender_id: user.id,
        message
      }])
      .select(`
        *,
        sender:users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending booking message:', error);
    throw error;
  }
}

/**
 * Subscribe to booking messages
 */
export async function subscribeToBookingMessages(
  bookingId: string, 
  onMessage: (message: BookingMessage) => void
) {
  return supabase
    .channel(`booking_messages:${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'booking_messages',
        filter: `booking_id=eq.${bookingId}`
      },
      async (payload) => {
        const { data: message } = await supabase
          .from('booking_messages')
          .select(`
            *,
            sender:users (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (message) {
          onMessage(message);
        }
      }
    )
    .subscribe();
}
