import { supabase } from '../supabase';

export async function getCurrentSubscription() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`*`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .single();

    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

export async function cancelSubscription() {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}