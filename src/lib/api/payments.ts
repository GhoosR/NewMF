import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createPaymentIntent(appointmentId: string, amount: number) {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appointmentId, amount }),
  });

  const { clientSecret } = await response.json();
  return clientSecret;
}

export async function processPayment(appointmentId: string, amount: number) {
  const stripe = await stripePromise;
  if (!stripe) throw new Error('Stripe failed to load');

  const clientSecret = await createPaymentIntent(appointmentId, amount);

  return stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement('card'),
      billing_details: {
        // Add billing details here
      },
    },
  });
}