import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Get session ID from URL
        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('Invalid payment session - No session ID found');
        }

        // Check if user already has an active subscription
        const { data: existingSubscription } = await supabase
          .from('users')
          .select('subscription_status, username')
          .eq('id', user.id)
          .single();

        if (existingSubscription?.subscription_status === 'active') {
          // If subscription is already active, store username and redirect to profile
          setUsername(existingSubscription.username);
          return;
        }

        // Verify subscription with edge function
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-subscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ sessionId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify subscription');
        }

        // Update user's subscription status
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            user_type: 'professional',
            subscription_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .eq('subscription_status', 'inactive') // Only update if currently inactive
          .select('username')
          .single();

        if (updateError) throw updateError;
        
        // Store the username for redirection
        if (updatedUser) {
          setUsername(updatedUser.username);
        } else {
          // If no username in the update result, fetch it separately
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single();
            
          if (userData) {
            setUsername(userData.username);
          }
        }

      } catch (err: any) {
        console.error('Error activating subscription:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    activateSubscription();
  }, [navigate, searchParams]);

  // Effect to handle redirection after username is set
  useEffect(() => {
    if (username && !loading && !error) {
      // Redirect to profile after a short delay
      const timer = setTimeout(() => {
        navigate(`/profile/${username}/listings`);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [username, loading, error, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-accent-text animate-spin mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Activating Your Subscription
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we verify your payment and set up your professional account...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Activation Failed
            </h2>
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-accent-text hover:text-accent-text/80"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to Professional!
          </h2>
          <p className="text-gray-600 text-center mb-4">
            Your subscription has been activated successfully. You now have access to all professional features.
          </p>
          {username ? (
            <p className="text-sm text-gray-500 text-center">
              Redirecting you to your profile...
            </p>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}