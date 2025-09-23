import { supabase } from '../supabase';

export async function setAvailability(practitionerId: string, availability: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}[]) {
  const { error } = await supabase
    .from('availability')
    .upsert(
      availability.map(slot => ({
        practitioner_id: practitionerId,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime
      }))
    );

  if (error) throw error;
}

export async function getAvailability(practitionerId: string) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('practitioner_id', practitionerId);

  if (error) throw error;
  return data;
}

export async function setException(practitionerId: string, date: Date, isAvailable: boolean) {
  const { error } = await supabase
    .from('availability_exceptions')
    .upsert([{
      practitioner_id: practitionerId,
      date: date.toISOString().split('T')[0],
      is_available: isAvailable
    }]);

  if (error) throw error;
}