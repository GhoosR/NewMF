import React from 'react';
import { Crown } from 'lucide-react';

interface SubscriptionBadgeProps {
  plan: string;
  type?: 'monthly' | 'yearly';
  className?: string;
}

export function SubscriptionBadge({ plan, type, className = '' }: SubscriptionBadgeProps) {
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      plan === 'pro' 
        ? 'bg-purple-100 text-purple-800'
        : 'bg-blue-100 text-blue-800'
    } ${className}`}>
      <Crown className="h-3 w-3 mr-1" />
      {type === 'yearly' ? 'Premium Yearly' : 'Premium Monthly'}
    </div>
  );
}