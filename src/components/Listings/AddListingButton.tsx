import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { AddListingModal } from './AddListingModal';
import { SubscriptionModal } from '../Subscription/SubscriptionModal';
import { supabase } from '../../lib/supabase';
import { isProfessional } from '../../lib/auth/authService';

interface AddListingButtonProps {
  className?: string;
}

export function AddListingButton({ className = '' }: AddListingButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const handleClick = () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('show-auth'));
    } else if (canCreateListing) {
      setShowModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#8DA847] hover:bg-[#7A9339] ${className}`}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Listing
      </button>

      {showModal && canCreateListing && (
        <AddListingModal 
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            window.location.reload();
          }}
        />
      )}

      {showUpgradeModal && (
        <SubscriptionModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setShowUpgradeModal(false);
            checkAccess();
          }}
        />
      )}
    </>
  );
}