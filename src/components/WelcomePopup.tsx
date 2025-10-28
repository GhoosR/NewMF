import { useState } from 'react';
import { X, Users, Calendar, Building2, Video, Crown, Star, Shield } from 'lucide-react';
import { subscriptionPlans, createCheckoutSession, redirectToCheckout, formatPrice } from '../lib/stripe/subscriptions';

export function WelcomePopup({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planId: 'monthly' | 'yearly') => {
    try {
      setLoading(true);
      setError(null);

      const sessionId = await createCheckoutSession(planId);
      await redirectToCheckout(sessionId);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to start subscription process');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Video,
      title: 'Live Streaming',
      description: 'Share daily wellness content with live streaming'
    },
    {
      icon: Users,
      title: 'Create Listings',
      description: 'List your services, events, and venues to reach more people'
    },
    {
      icon: Calendar,
      title: 'Host Events',
      description: 'Organise and promote wellness events in your community'
    },
    {
      icon: Building2,
      title: 'Build Communities',
      description: 'Create and manage your own wellness community'
    },
    {
      icon: Star,
      title: 'Premium Support',
      description: 'Get priority customer support and assistance'
    },
    {
      icon: Shield,
      title: 'Advanced Features',
      description: 'Access exclusive tools and advanced functionality'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4 lg:p-6">
      <div className="bg-white w-full h-full sm:rounded-xl sm:shadow-xl sm:max-w-4xl sm:w-auto sm:mx-auto sm:my-4 lg:my-8 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-accent-text to-accent-text/80 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Welcome to Mindful Family!</h2>
            <p className="text-white/90 text-lg">
              Unlock all features to enhance your wellness journey
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-accent-text/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent-text" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-content mb-1">{feature.title}</h3>
                    <p className="text-content/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-xl border-2 transition-all cursor-pointer ${
                  activePlan === plan.id
                    ? 'border-accent-text bg-accent-text/5 shadow-lg'
                    : 'border-gray-200 hover:border-accent-text/50 hover:shadow-md'
                }`}
                onClick={() => setActivePlan(plan.id)}
              >
                {plan.savings && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {plan.savings}
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-xl font-bold text-content mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-content">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-content/60">/{plan.interval}</span>
                  </div>
                  
                  {plan.id === 'yearly' && (
                    <p className="text-sm text-green-600 font-medium mb-4">
                      Save £10 compared to monthly billing
                    </p>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      activePlan === plan.id
                        ? 'bg-accent-text text-white hover:bg-accent-text/90'
                        : 'bg-gray-100 text-content hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {loading ? 'Processing...' : `Choose ${plan.name}`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={onClose}
              className="text-base text-content/60 hover:text-content transition-colors py-3 px-6 rounded-lg hover:bg-gray-50"
            >
              Maybe Later
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-content/60">
              Secure payment • Cancel anytime • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}