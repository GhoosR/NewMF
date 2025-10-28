export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  practitioner_id: string;
  client_id: string;
  status: BookingStatus;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string;
  package_id?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  practitioner?: {
    id: string;
    title: string;
    user: {
      id: string;
      username: string;
      full_name: string;
      avatar_url?: string;
    };
  };
  client?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  package?: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
  };
}

export interface PractitionerWorkingHours {
  id: string;
  practitioner_id: string;
  day_of_week: number; // 0=Sunday, 1=Monday, etc.
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_bookings_per_slot: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PractitionerAvailabilityException {
  id: string;
  practitioner_id: string;
  date: string;
  is_available: boolean;
  custom_start_time?: string;
  custom_end_time?: string;
  custom_slot_duration_minutes?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PractitionerAvailability {
  id: string;
  practitioner_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_bookings: number;
  current_bookings: number;
  created_at: string;
  updated_at: string;
}

export interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface CreateBookingData {
  practitioner_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  notes?: string;
  package_id?: string;
}

export interface UpdateAvailabilityData {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_bookings?: number;
}

export interface BookingFilters {
  status?: BookingStatus[];
  date_from?: string;
  date_to?: string;
  practitioner_id?: string;
  client_id?: string;
}

export interface AvailabilitySlot {
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_bookings: number;
  current_bookings: number;
}

export interface BookingCalendarDay {
  date: string;
  slots: AvailabilitySlot[];
  is_available: boolean;
}

export interface WorkingHoursData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  max_bookings_per_slot: number;
  is_active: boolean;
}

export interface AvailabilityExceptionData {
  date: string;
  is_available: boolean;
  custom_start_time?: string;
  custom_end_time?: string;
  custom_slot_duration_minutes?: number;
  notes?: string;
}
