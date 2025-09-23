import { supabase } from '../supabase';
import type { AppointmentStatus, Appointment } from '../../types/appointments';

export async function createAppointmentRequest(data: {
  practitionerId: string;
  startTime: Date;
  endTime: Date;
  serviceDescription: string;
}) {
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert([{
      practitioner_id: data.practitionerId,
      client_id: (await supabase.auth.getUser()).data.user?.id,
      start_time: data.startTime.toISOString(),
      end_time: data.endTime.toISOString(),
      status: 'pending',
      service_description: data.serviceDescription,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error) throw error;
  return appointment;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  quoteAmount?: number
) {
  const updates: Partial<Appointment> = { status };
  if (quoteAmount) {
    updates.quote_amount = quoteAmount;
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAppointments(type: 'practitioner' | 'client') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const query = supabase
    .from('appointments')
    .select(`
      *,
      practitioner:practitioners(
        id,
        title,
        user:users(
          id,
          full_name,
          avatar_url
        )
      ),
      client:users(
        id,
        full_name,
        avatar_url
      )
    `);

  if (type === 'practitioner') {
    query.eq('practitioner.user.id', user.id);
  } else {
    query.eq('client_id', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}