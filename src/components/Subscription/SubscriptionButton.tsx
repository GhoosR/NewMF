import React from 'react';
import { Sparkles } from 'lucide-react';
import { SubscriptionModal } from './SubscriptionModal';

interface SubscriptionButtonProps {
  className?: string;
  planId?: string;
}

export function SubscriptionButton({ className = '', planId }: SubscriptionButtonProps) {
  const [showModal, setShowModal] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<'monthly' | 'yearly'>('monthly');

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90 ${className}`}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Upgrade to Premium
      </button>

      {showModal && (
        <SubscriptionModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            window.location.reload();
          }}
          selectedPlan={selectedPlan}
        />
      )}
    </>
  );
}