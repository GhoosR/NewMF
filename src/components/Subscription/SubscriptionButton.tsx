import React, { useState, useEffect } from 'react';
import { Sparkles, Smartphone, Crown } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';
import { RevenueCatSubscriptionModal } from './RevenueCatSubscriptionModal';
import { useSubscription } from '../../hooks/useSubscription';
import { detectWebViewEnvironment } from '../../lib/webviewDetection';

interface SubscriptionButtonProps {
  className?: string;
  planId?: string;
}

export function SubscriptionButton({ className = '', planId }: SubscriptionButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showRevenueCatModal, setShowRevenueCatModal] = useState(false);
  const [platform, setPlatform] = useState<'web' | 'ios' | 'android'>('web');
  const { hasPremium, loading } = useSubscription();

  useEffect(() => {
    // Detect platform using webview detection
    const webViewInfo = detectWebViewEnvironment();
    
    if (webViewInfo.platform === 'ios') {
      setPlatform('ios');
    } else if (webViewInfo.platform === 'android') {
      setPlatform('android');
    } else {
      setPlatform('web');
    }
  }, []);

  const handleUpgrade = () => {
    if (platform === 'ios') {
      setShowRevenueCatModal(true);
    } else {
      setShowModal(true);
    }
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center px-4 py-2 bg-gray-300 text-gray-600 rounded-md ${className}`}>
        <Sparkles className="h-4 w-4 mr-2" />
        Loading...
      </div>
    );
  }

  if (hasPremium) {
    return (
      <div className={`inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md ${className}`}>
        <Crown className="h-4 w-4 mr-2" />
        Premium Active
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleUpgrade}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90 ${className}`}
      >
        {platform === 'ios' ? (
          <Smartphone className="h-4 w-4 mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Upgrade to Premium
      </button>

      {showModal && (
        <SubscriptionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            window.location.reload();
          }}
          selectedPlan={planId as 'monthly' | 'yearly'}
        />
      )}

      {showRevenueCatModal && (
        <RevenueCatSubscriptionModal
          onClose={() => setShowRevenueCatModal(false)}
          onSuccess={() => {
            setShowRevenueCatModal(false);
            window.location.reload();
          }}
        />
      )}
    </>
  );
}