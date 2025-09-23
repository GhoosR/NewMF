import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.error('Stripe public key not found in environment variables');
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};