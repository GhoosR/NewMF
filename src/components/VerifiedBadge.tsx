import React from 'react';
import { BadgeCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  className?: string;
}

export function VerifiedBadge({ className = '' }: VerifiedBadgeProps) {
  return (
    <BadgeCheck 
      className={`inline-block text-[#feb800] fill-[#feb800] stroke-white ${className}`} 
      size={16}
    />
  );
}