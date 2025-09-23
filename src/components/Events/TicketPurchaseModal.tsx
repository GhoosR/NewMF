import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from '../../lib/supabase';
import { getStripe } from '../../lib/stripe';

interface TicketPurchaseModalProps {
  event: {
    id: string;
    title: string;
    price: number;
    max_participants?: number;
    current_participants?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw stripeError;
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="mt-4 text-red-600 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-4 w-4 mr-2" />
            Processing...
          </>
        ) : (
          'Complete Purchase'
        )}
      </button>
    </form>
  );
}

export function TicketPurchaseModal({ event, onClose, onSuccess }: TicketPurchaseModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const stripe = getStripe();

  const remainingTickets = event.max_participants 
    ? event.max_participants - (event.current_participants || 0)
    : null;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/process-ticket-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setClientSecret(data.clientSecret);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-content">Purchase Tickets</h2>
          <button onClick={onClose} className="text-content/60 hover:text-content">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!clientSecret ? (
          <>
            <div className="mb-6">
              <h3 className="font-medium text-content mb-2">{event.title}</h3>
              <p className="text-content/60">€{event.price} per ticket</p>
              {remainingTickets !== null && (
                <p className="text-sm text-content/60 mt-1">
                  {remainingTickets} tickets remaining
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-content mb-2">
                Number of Tickets
              </label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20"
              >
                {[...Array(Math.min(remainingTickets || 10, 10))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {i === 0 ? 'ticket' : 'tickets'} - €{event.price * (i + 1)}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="mb-4 text-red-600 text-sm">{error}</div>
            )}

            <button
              onClick={handlePurchase}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                `Purchase Tickets - €${event.price * quantity}`
              )}
            </button>
          </>
        ) : stripe ? (
          <Elements stripe={stripe} options={{ clientSecret }}>
            <CheckoutForm clientSecret={clientSecret} onSuccess={onSuccess} />
          </Elements>
        ) : (
          <div className="text-red-600 text-sm">Failed to load payment system. Please try again.</div>
        )}
      </div>
    </div>
  );
}