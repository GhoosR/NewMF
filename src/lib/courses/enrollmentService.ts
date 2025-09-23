import { supabase } from '../supabase';

export async function enrollInCourse(courseId: string, amount: number, currency: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already enrolled
  const { data: existingEnrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existingEnrollment) {
    throw new Error('You are already enrolled in this course');
  }

  // Create enrollment
  const { data: enrollment, error } = await supabase
    .from('course_enrollments')
    .insert([{
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      amount,
      currency
    }])
    .select()
    .single();

  if (error) throw error;
  return enrollment;
}

export async function checkEnrollment(courseId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('course_enrollments')
    .select('status')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  return data?.status === 'active';
}