import { supabase } from '../supabase';

export interface RevenueCatProduct {
  id: string;
  name: string;
  description: string;
  platform: string;
  price: number;
  currency: string;
  interval: string;
  interval_count: number;
}

export interface RevenueCatEntitlement {
  id: string;
  name: string;
  description: string;
  features: string[];
}

export interface RevenueCatSubscription {
  id: string;
  user_id: string;
  revenuecat_user_id: string;
  product_id: string;
  entitlement_id: string;
  platform: string;
  purchase_date: string;
  expiration_date?: string;
  is_active: boolean;
  is_trial: boolean;
  is_sandbox: boolean;
  original_transaction_id: string;
  latest_receipt_info: any;
}

/**
 * Get all available RevenueCat products for a specific platform
 */
export async function getRevenueCatProducts(platform: string = 'ios'): Promise<RevenueCatProduct[]> {
  try {
    const { data, error } = await supabase
      .from('revenuecat_products')
      .select('*')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching RevenueCat products:', error);
    return [];
  }
}

/**
 * Get all available RevenueCat entitlements
 */
export async function getRevenueCatEntitlements(): Promise<RevenueCatEntitlement[]> {
  try {
    const { data, error } = await supabase
      .from('revenuecat_entitlements')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching RevenueCat entitlements:', error);
    return [];
  }
}

/**
 * Get user's RevenueCat subscriptions
 */
export async function getUserRevenueCatSubscriptions(userId: string): Promise<RevenueCatSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('revenuecat_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user RevenueCat subscriptions:', error);
    return [];
  }
}

/**
 * Check if user has active RevenueCat subscription for specific entitlement
 */
export async function hasRevenueCatSubscription(
  userId: string, 
  entitlementId: string = 'premium'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_revenuecat_subscription', {
      p_user_id: userId,
      p_entitlement_id: entitlementId
    });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error checking RevenueCat subscription:', error);
    return false;
  }
}

/**
 * Get user's active RevenueCat subscription
 */
export async function getActiveRevenueCatSubscription(userId: string): Promise<RevenueCatSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('revenuecat_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('purchase_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching active RevenueCat subscription:', error);
    return null;
  }
}

/**
 * Link RevenueCat user ID to existing user account
 */
export async function linkRevenueCatUser(
  userId: string, 
  revenuecatUserId: string, 
  platform: string = 'ios'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        revenuecat_user_id: revenuecatUserId,
        revenuecat_platform: platform,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error linking RevenueCat user:', error);
    return false;
  }
}

/**
 * Check if user has any active subscription (Stripe or RevenueCat)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Check Stripe subscription
    const { data: stripeSubscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (stripeSubscription) return true;

    // Check RevenueCat subscription
    const hasRevenueCat = await hasRevenueCatSubscription(userId);
    return hasRevenueCat;
  } catch (error) {
    console.error('Error checking active subscription:', error);
    return false;
  }
}

/**
 * Get subscription source (stripe, revenuecat, or none)
 */
export async function getSubscriptionSource(userId: string): Promise<'stripe' | 'revenuecat' | 'none'> {
  try {
    // Check Stripe subscription first
    const { data: stripeSubscription } = await supabase
      .from('user_subscriptions')
      .select('status, revenuecat_platform')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (stripeSubscription) {
      // If it has RevenueCat fields, it's from RevenueCat
      if (stripeSubscription.revenuecat_platform) {
        return 'revenuecat';
      }
      return 'stripe';
    }

    // Check RevenueCat subscription
    const hasRevenueCat = await hasRevenueCatSubscription(userId);
    return hasRevenueCat ? 'revenuecat' : 'none';
  } catch (error) {
    console.error('Error getting subscription source:', error);
    return 'none';
  }
}

/**
 * Get comprehensive subscription info for user
 */
export async function getSubscriptionInfo(userId: string) {
  try {
    const [stripeSubscription, revenuecatSubscriptions, subscriptionSource] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle(),
      getUserRevenueCatSubscriptions(userId),
      getSubscriptionSource(userId)
    ]);

    return {
      source: subscriptionSource,
      stripe: stripeSubscription.data,
      revenuecat: revenuecatSubscriptions,
      hasActive: subscriptionSource !== 'none'
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return {
      source: 'none' as const,
      stripe: null,
      revenuecat: [],
      hasActive: false
    };
  }
}


