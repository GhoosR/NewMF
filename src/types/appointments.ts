export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Appointment {
  id: string;
  practitioner_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  service_description?: string;
  quote_amount?: number;
  quote_currency: string;
  payment_status: PaymentStatus;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}