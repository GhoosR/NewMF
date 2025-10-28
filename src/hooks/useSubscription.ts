import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  getUnifiedSubscription, 
  hasPremiumAccess, 
  getSubscriptionSource,
  isProfessional,
  getSubscriptionFeatures,
  hasFeatureAccess,
  getSubscriptionManagementUrl,
  type UnifiedSubscription,
  type SubscriptionSource
} from '../lib/subscription';

export interface UseSubscriptionReturn {
  subscription: UnifiedSubscription | null;
  hasPremium: boolean;
  isProfessional: boolean;
  source: SubscriptionSource;
  features: string[];
  managementUrl: string | null;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing subscription state and features
 */
export function useSubscription(userId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UnifiedSubscription | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [isProfessional, setIsProfessional] = useState(false);
  const [source, setSource] = useState<SubscriptionSource>('none');
  const [features, setFeatures] = useState<string[]>(['basic_features']);
  const [managementUrl, setManagementUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if no userId provided
      let currentUserId = userId;
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        currentUserId = user.id;
      }

      // Load all subscription data in parallel
      const [
        subscriptionData,
        premiumAccess,
        subscriptionSource,
        professionalStatus,
        subscriptionFeatures,
        managementUrlData
      ] = await Promise.all([
        getUnifiedSubscription(currentUserId),
        hasPremiumAccess(currentUserId),
        getSubscriptionSource(currentUserId),
        isProfessional(currentUserId),
        getSubscriptionFeatures(currentUserId),
        getSubscriptionManagementUrl(currentUserId)
      ]);

      setSubscription(subscriptionData);
      setHasPremium(premiumAccess);
      setIsProfessional(professionalStatus);
      setSource(subscriptionSource);
      setFeatures(subscriptionFeatures);
      setManagementUrl(managementUrlData);
    } catch (err: any) {
      console.error('Error loading subscription data:', err);
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    return features.includes(feature);
  };

  const refresh = async () => {
    await loadSubscriptionData();
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [userId]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadSubscriptionData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    subscription,
    hasPremium,
    isProfessional,
    source,
    features,
    managementUrl,
    loading,
    error,
    hasFeature,
    refresh
  };
}

/**
 * Hook for checking specific feature access
 */
export function useFeatureAccess(feature: string, userId?: string): boolean {
  const { hasFeature, loading } = useSubscription(userId);
  
  if (loading) return false;
  return hasFeature(feature);
}

/**
 * Hook for premium access check
 */
export function usePremiumAccess(userId?: string): boolean {
  const { hasPremium, loading } = useSubscription(userId);
  
  if (loading) return false;
  return hasPremium;
}

/**
 * Hook for professional status check
 */
export function useProfessionalStatus(userId?: string): boolean {
  const { isProfessional, loading } = useSubscription(userId);
  
  if (loading) return false;
  return isProfessional;
}


