import { supabase } from '../supabase';
import { getStripe } from './client';

// Stripe configuration
const STRIPE_CONFIG = {
  plans: {
    monthly: {
      priceId: 'price_1R0RtjJscEBO2friHwUBGSEU',
      amount: 500, // £5.00 in cents
      currency: 'gbp',
      interval: 'month'
    },
    yearly: {
      priceId: 'price_1R0RukJscEBO2friyguPw3Q7',
      amount: 5000, // £50.00 in cents
      currency: 'gbp',
      interval: 'year'
    }
  }
};

export const formatPrice = (amount: number, currency: string = 'eur'): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount / 100);
};

export interface SubscriptionPlan {
  id: 'monthly' | 'yearly';
  name: string;
  price: number;
  currency: string;
  interval: string;
  priceId: string;
  savings?: string;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Premium',
    price: STRIPE_CONFIG.plans.monthly.amount,
    currency: STRIPE_CONFIG.plans.monthly.currency,
    interval: 'month',
    priceId: STRIPE_CONFIG.plans.monthly.priceId
  },
  {
    id: 'yearly',
    name: 'Yearly Premium',
    price: STRIPE_CONFIG.plans.yearly.amount,
    currency: STRIPE_CONFIG.plans.yearly.currency,
    interval: 'year',
    priceId: STRIPE_CONFIG.plans.yearly.priceId,
    savings: 'Save 17%'
  }
];

export async function createCheckoutSession(planId: 'monthly' | 'yearly'): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan selected');

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        priceId: plan.priceId,
        planId: planId,
        successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function redirectToCheckout(sessionId: string): Promise<void> {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe failed to load');

  const { error } = await stripe.redirectToCheckout({ sessionId });
  if (error) throw error;
}

export async function getCurrentSubscription() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

export async function cancelSubscription(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
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
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

export async function createCustomerPortalSession(): Promise<string> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        returnUrl: `${window.location.origin}/profile`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
}