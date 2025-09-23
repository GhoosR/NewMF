import { supabase } from '../supabase';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export async function checkVerificationStatus(userId: string | undefined, retries = MAX_RETRIES): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('verified')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      throw userError;
    }
    
    return !!userData?.verified;
  } catch (error: any) {
    // If we have retries left and it's not a "not found" error, retry
    if (retries > 0 && error.code !== 'PGRST116') {
      console.warn(`Retrying verification check (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return checkVerificationStatus(userId, retries - 1);
    }
    
    console.error('Error checking verification status:', error);
    return false;
  }
}