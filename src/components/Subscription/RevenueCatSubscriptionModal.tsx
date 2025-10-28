import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Star, Smartphone, Globe } from 'lucide-react';
import { Modal } from '../Modal';
import { useSubscription } from '../../hooks/useSubscription';
import { getAvailableProducts, purchaseProduct, restorePurchases, hasPremiumAccess } from '../../lib/revenuecat/ios';

interface RevenueCatProduct {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
  introPrice?: {
    price: number;
    priceString: string;
    period: string;
    cycles: number;
    periodUnit: string;
    periodNumberOfUnits: number;
  };
}

interface RevenueCatSubscriptionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RevenueCatSubscriptionModal({ onClose, onSuccess }: RevenueCatSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<RevenueCatProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const { hasPremium, refresh } = useSubscription();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const availableProducts = await getAvailableProducts();
      setProducts(availableProducts);
      
      // Select the monthly product by default
      const monthlyProduct = availableProducts.find(p => p.identifier.includes('monthly'));
      if (monthlyProduct) {
        setSelectedProduct(monthlyProduct.identifier);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      setError(null);

      const success = await purchaseProduct(selectedProduct);
      if (success) {
        await refresh();
        onSuccess();
        onClose();
      } else {
        setError('Purchase failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      setError(null);

      const success = await restorePurchases();
      if (success) {
        await refresh();
        if (hasPremium) {
          onSuccess();
          onClose();
        } else {
          setError('No previous purchases found to restore.');
        }
      } else {
        setError('Failed to restore purchases. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to restore purchases. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  const features = [
    {
      icon: Crown,
      title: 'Create Listings',
      description: 'List your services, events, and venues'
    },
    {
      icon: Star,
      title: 'Build Communities',
      description: 'Create and manage your own wellness communities'
    },
    {
      icon: Globe,
      title: 'Live Stream Access',
      description: 'Join daily wellness sessions and expert talks'
    },
    {
      icon: Check,
      title: 'Priority Support',
      description: 'Get priority customer support and assistance'
    }
  ];

  const formatPrice = (product: RevenueCatProduct) => {
    if (product.introPrice) {
      return `${product.introPrice.priceString} for ${product.introPrice.periodNumberOfUnits} ${product.introPrice.periodUnit.toLowerCase()}(s), then ${product.priceString}/${product.identifier.includes('yearly') ? 'year' : 'month'}`;
    }
    return `${product.priceString}/${product.identifier.includes('yearly') ? 'year' : 'month'}`;
  };

  const getSavings = (product: RevenueCatProduct) => {
    if (product.identifier.includes('yearly')) {
      const monthlyProduct = products.find(p => p.identifier.includes('monthly'));
      if (monthlyProduct) {
        const yearlyEquivalent = monthlyProduct.price * 12;
        const savings = ((yearlyEquivalent - product.price) / yearlyEquivalent * 100).toFixed(0);
        return `Save ${savings}%`;
      }
    }
    return null;
  };

  return (
    <Modal title="Upgrade to Premium" onClose={onClose}>
      <div className="max-w-2xl mx-auto">
        {/* Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-accent-text" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
            {products.map((product) => {
              const savings = getSavings(product);
              const isYearly = product.identifier.includes('yearly');
              
              return (
                <div
                  key={product.identifier}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProduct === product.identifier
                      ? 'border-accent-text bg-accent-base/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProduct(product.identifier)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={selectedProduct === product.identifier}
                        onChange={() => setSelectedProduct(product.identifier)}
                        className="h-4 w-4 text-accent-text focus:ring-accent-text border-gray-300"
                      />
                      <div>
                        <h4 className="font-medium text-gray-900">{product.title}</h4>
                        <p className="text-sm text-gray-600">{product.description}</p>
                        <p className="text-sm font-medium text-accent-text">{formatPrice(product)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {savings && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {savings}
                        </span>
                      )}
                      {isYearly && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                          Best Value
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRestoring ? 'Restoring...' : 'Restore Purchases'}
          </button>
          
          <button
            onClick={handlePurchase}
            disabled={loading || !selectedProduct}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </button>
        </div>

        {/* Terms */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>
            Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.
            Your account will be charged for renewal within 24 hours prior to the end of the current period.
            You can manage and cancel your subscriptions by going to your account settings on the App Store after purchase.
          </p>
        </div>
      </div>
    </Modal>
  );
}


