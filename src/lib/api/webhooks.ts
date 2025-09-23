import { supabase } from '../supabase';

export async function handleStripeWebhook(event: any) {
  const { type, data: { object } } = event;

  switch (type) {
    case 'account.updated': {
      const accountId = object.id;
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_connect_id', accountId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({
            stripe_connect_status: object.payouts_enabled ? 'connected' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
      break;
    }

    case 'account.application.deauthorized': {
      const accountId = object.id;
      await supabase
        .from('users')
        .update({
          stripe_connect_status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('stripe_connect_id', accountId);
      break;
    }

    // Add more webhook handlers as needed
  }
}