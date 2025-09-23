import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { isProfessional } from '../lib/auth/authService';
import { SubscriptionModal } from './Subscription/SubscriptionModal';

interface HeroProps {
  title: string;
  subtitle: string;
  image: string;
  showNearMe?: boolean;
  showAddListing?: boolean;
  onAddListing?: () => void;
}

export function Hero({ title, subtitle, image, showNearMe = false, showAddListing = false, onAddListing }: HeroProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkAccess();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkAccess();
      } else {
        setCanCreateListing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccess = async () => {
    const hasProfessionalAccess = await isProfessional();
    setCanCreateListing(hasProfessionalAccess);
  };

  const handleAddListing = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('show-auth'));
    } else if (canCreateListing) {
      onAddListing?.();
    } else {
      setShowUpgradeModal(true);
    }
  };

  return (
    <div className="relative mb-12">
      {/* Mobile Hero Image with rounded borders and margin */}
      <div className="lg:hidden w-full px-4 mt-4 mb-8">
        <img
          src={image}
          alt="Hero"
          className="w-full h-[160px] object-cover rounded-2xl shadow-sm"
        />
      </div>

      <div className="py-8 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              {showNearMe && (
                <button className="mb-6 px-6 py-2 bg-[#FFC107] text-white rounded-full font-medium hover:bg-[#FFA000] transition-colors">
                  Near Me
                </button>
              )}
              <h1 className="text-4xl lg:text-5xl font-gelica leading-tight mb-4 lg:mb-6">{title}</h1>
              <p className="text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8">{subtitle}</p>
              {showAddListing && (
                <button 
                  onClick={handleAddListing}
                  className="px-6 lg:px-8 py-3 bg-[#8DA847] text-white rounded-lg font-medium hover:bg-[#7A9339] transition-colors"
                >
                  Submit Listing
                </button>
              )}
            </div>
            <div className="hidden lg:block">
              <img 
                src={image} 
                alt="Hero" 
                className="w-full h-[450px] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
      {showUpgradeModal && (
        <SubscriptionModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setShowUpgradeModal(false);
            checkAccess();
          }}
        />
      )}
    </div>
  );
}