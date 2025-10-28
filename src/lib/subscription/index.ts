/**
 * Unified subscription service that handles both Stripe and RevenueCat
 */

import { supabase } from '../supabase';
import { getSubscriptionInfo, hasActiveSubscription } from '../revenuecat';
import { getCurrentSubscription as getStripeSubscription } from '../stripe/subscription';

export type SubscriptionSource = 'stripe' | 'revenuecat' | 'none';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'trial';

export interface UnifiedSubscription {
  id: string;
  userId: string;
  source: SubscriptionSource;
  status: SubscriptionStatus;
  type: 'monthly' | 'yearly' | 'lifetime';
  platform: 'web' | 'ios' | 'android';
  startDate: string;
  endDate?: string;
  isTrial: boolean;
  isActive: boolean;
  productId?: string;
  entitlementId?: string;
  originalTransactionId?: string;
}

/**
 * Get unified subscription information for a user
 */
export async function getUnifiedSubscription(userId: string): Promise<UnifiedSubscription | null> {
  try {
    const subscriptionInfo = await getSubscriptionInfo(userId);
    
    if (subscriptionInfo.source === 'none') {
      return null;
    }
    
    if (subscriptionInfo.source === 'stripe' && subscriptionInfo.stripe) {
      return {
        id: subscriptionInfo.stripe.id,
        userId: subscriptionInfo.stripe.user_id,
        source: 'stripe',
        status: subscriptionInfo.stripe.status as SubscriptionStatus,
        type: subscriptionInfo.stripe.subscription_type as 'monthly' | 'yearly',
        platform: 'web',
        startDate: subscriptionInfo.stripe.current_period_start,
        endDate: subscriptionInfo.stripe.current_period_end,
        isTrial: false,
        isActive: subscriptionInfo.stripe.status === 'active'
      };
    }
    
    if (subscriptionInfo.source === 'revenuecat' && subscriptionInfo.revenuecat.length > 0) {
      const activeSubscription = subscriptionInfo.revenuecat.find(sub => sub.is_active);
      if (activeSubscription) {
        return {
          id: activeSubscription.id,
          userId: activeSubscription.user_id,
          source: 'revenuecat',
          status: activeSubscription.is_active ? 'active' : 'inactive',
          type: activeSubscription.product_id.includes('yearly') ? 'yearly' : 'monthly',
          platform: activeSubscription.platform as 'ios' | 'android',
          startDate: activeSubscription.purchase_date,
          endDate: activeSubscription.expiration_date,
          isTrial: activeSubscription.is_trial,
          isActive: activeSubscription.is_active,
          productId: activeSubscription.product_id,
          entitlementId: activeSubscription.entitlement_id,
          originalTransactionId: activeSubscription.original_transaction_id
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting unified subscription:', error);
    return null;
  }
}

/**
 * Check if user has active premium subscription
 */
export async function hasPremiumAccess(userId: string): Promise<boolean> {
  try {
    const hasActive = await hasActiveSubscription(userId);
    return hasActive;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}

/**
 * Get subscription source for user
 */
export async function getSubscriptionSource(userId: string): Promise<SubscriptionSource> {
  try {
    const subscriptionInfo = await getSubscriptionInfo(userId);
    return subscriptionInfo.source;
  } catch (error) {
    console.error('Error getting subscription source:', error);
    return 'none';
  }
}

/**
 * Check if user is a professional (has premium access)
 */
export async function isProfessional(userId?: string): Promise<boolean> {
  try {
    // If no userId provided, get current user
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }
    
    // Check if user has premium access
    const hasPremium = await hasPremiumAccess(userId);
    
    // Also check user_type for backward compatibility
    const { data: userData } = await supabase
      .from('users')
      .select('user_type, subscription_status')
      .eq('id', userId)
      .single();
    
    const isProfessionalType = userData?.user_type === 'professional';
    const hasActiveSubscription = userData?.subscription_status === 'active';
    
    return hasPremium || (isProfessionalType && hasActiveSubscription);
  } catch (error) {
    console.error('Error checking professional status:', error);
    return false;
  }
}

/**
 * Get subscription features for user
 */
export async function getSubscriptionFeatures(userId: string): Promise<string[]> {
  try {
    const subscription = await getUnifiedSubscription(userId);
    
    if (!subscription || !subscription.isActive) {
      return ['basic_features']; // Basic features for free users
    }
    
    // Get entitlement features from RevenueCat
    if (subscription.source === 'revenuecat' && subscription.entitlementId) {
      const { data: entitlement } = await supabase
        .from('revenuecat_entitlements')
        .select('features')
        .eq('entitlement_id', subscription.entitlementId)
        .single();
      
      if (entitlement?.features) {
        return entitlement.features;
      }
    }
    
    // Default premium features
    return [
      'create_listings',
      'host_events',
      'advanced_analytics',
      'priority_support',
      'live_streaming',
      'community_management'
    ];
  } catch (error) {
    console.error('Error getting subscription features:', error);
    return ['basic_features'];
  }
}

/**
 * Check if user has specific feature access
 */
export async function hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
  try {
    const features = await getSubscriptionFeatures(userId);
    return features.includes(feature);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get subscription management URL
 */
export async function getSubscriptionManagementUrl(userId: string): Promise<string | null> {
  try {
    const subscription = await getUnifiedSubscription(userId);
    
    if (!subscription) return null;
    
    if (subscription.source === 'stripe') {
      // Return Stripe customer portal URL
      const { data: userData } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      
      if (userData?.stripe_customer_id) {
        // This would create a Stripe customer portal session
        return `/subscription/manage?customer_id=${userData.stripe_customer_id}`;
      }
    }
    
    if (subscription.source === 'revenuecat') {
      // For RevenueCat, users manage subscriptions through App Store
      if (subscription.platform === 'ios') {
        return 'https://apps.apple.com/account/subscriptions';
      } else if (subscription.platform === 'android') {
        return 'https://play.google.com/store/account/subscriptions';
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting subscription management URL:', error);
    return null;
  }
}

/**
 * Cancel subscription (platform-specific)
 */
export async function cancelSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await getUnifiedSubscription(userId);
    
    if (!subscription) return false;
    
    if (subscription.source === 'stripe') {
      // Cancel Stripe subscription
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    }
    
    if (subscription.source === 'revenuecat') {
      // For RevenueCat, cancellation is handled through the app store
      // We can't programmatically cancel, but we can provide instructions
      console.log('RevenueCat subscriptions must be cancelled through the App Store');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }
}

/**
 * Get subscription analytics data
 */
export async function getSubscriptionAnalytics(userId: string) {
  try {
    const subscription = await getUnifiedSubscription(userId);
    
    if (!subscription) {
      return {
        hasSubscription: false,
        source: 'none',
        features: ['basic_features']
      };
    }
    
    const features = await getSubscriptionFeatures(userId);
    
    return {
      hasSubscription: true,
      source: subscription.source,
      status: subscription.status,
      type: subscription.type,
      platform: subscription.platform,
      isTrial: subscription.isTrial,
      features,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    };
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    return {
      hasSubscription: false,
      source: 'none',
      features: ['basic_features']
    };
  }
}


