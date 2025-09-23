import React, { useState, useEffect } from 'react';
import { isProfessional } from '../../lib/auth/authService';
import { SubscriptionButton } from '../../components/Subscription';
import { createCustomerPortalSession } from '../../lib/stripe/customerPortal';
import { supabase } from '../../lib/supabase';

interface PaymentSettingsTabProps {
  userId: string;
}

export function PaymentSettingsTab({ userId }: PaymentSettingsTabProps) {
  const [canAcceptPayments, setCanAcceptPayments] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive'>('inactive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const checkAccess = async () => {
      const hasProfessionalAccess = await isProfessional();
      setCanAcceptPayments(hasProfessionalAccess);
    };
    checkAccess();
  }, []);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnProfile(user?.id === userId);

      if (user?.id === userId) {
        // Get user subscription data
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, stripe_customer_id')
          .eq('id', userId)
          .single();
        
        if (userData) {
          setSubscriptionStatus(userData.subscription_status || 'inactive');
          setStripeCustomerId(userData.stripe_customer_id);
        }

        // Get active subscription details
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('subscription_type')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (subscriptionData) {
          setSubscriptionType(subscriptionData.subscription_type as 'monthly' | 'yearly');
        }
      }
    };
    checkOwnership();
  }, [userId]);

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      setError('No customer ID found. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const portalUrl = await createCustomerPortalSession(
        stripeCustomerId,
        `${window.location.origin}/profile/${userId}/payment-settings`
      );
      
      window.location.href = portalUrl;
    } catch (err: any) {
      console.error('Error accessing customer portal:', err);
      setError(err.message || 'Failed to access customer portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnProfile) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-content">Payment Settings</h2>

      {/* Subscription Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-accent-text/10">
        <h3 className="text-lg font-medium text-content mb-4">Subscription Status</h3>
        
        {subscriptionStatus === 'active' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-content font-medium">Professional Membership</p>
                <p className="text-content/60 text-sm">
                  {subscriptionType === 'yearly' ? '£50.00/year' : '£5.00/month'}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </span>
            </div>
            
            <div className="border-t border-accent-text/10 pt-4">
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Subscription'}
              </button>
              <p className="mt-2 text-sm text-content/60">
                Manage your subscription, payment methods, and billing information in Stripe's secure portal.
                You'll receive a one-time passcode via email to access your account.
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-accent-base/10 rounded-lg p-4">
              <p className="text-content mb-4">
                Upgrade to a Professional Membership to unlock premium features:
              </p>
              <ul className="space-y-2 text-content/80">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Create and manage listings
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Host events and sell tickets
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Create and sell online courses
                </li>
              </ul>
            </div>

            <SubscriptionButton className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}