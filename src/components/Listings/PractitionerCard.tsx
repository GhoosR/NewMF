import React from 'react';
import { MapPin, Globe, Mic2, Coins, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatCategoryName, formatWorkArrangement } from '../../lib/utils/formatters';
import type { Practitioner } from '../../types/practitioners';

interface PractitionerCardProps {
  practitioner: Practitioner;
}

// Helper function to convert currency code to symbol
function getCurrencySymbol(currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CHF': 'CHF'
  };
  
  return symbols[currency] || currency;
}

export function PractitionerCard({ practitioner }: PractitionerCardProps) {
  const displayImage = practitioner.images?.[0] || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400';

  const price = practitioner.starting_price ? `${getCurrencySymbol(practitioner.currency)}${practitioner.starting_price}` : null;

  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/practitioners/${practitioner.slug}`}>
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={displayImage}
            alt={practitioner.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {practitioner.user && (
            <Link 
              to={`/profile/${practitioner.user.username}/listings`}
              className="flex items-center space-x-2 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar 
                url={practitioner.user.avatar_url} 
                size="sm" 
                userId={practitioner.user_id}
                editable={false}
              />
              <Username 
                username={practitioner.user.username || 'Anonymous'}
                userId={practitioner.user_id}
                verified={!!practitioner.user?.verified}
                className="text-sm text-content group-hover:text-accent-text"
              />
            </Link>
          )}
          <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
            {formatCategoryName(practitioner.category)}
          </span>
        </div>
        
        <Link to={`/practitioners/${practitioner.slug}`}>
          <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
            {practitioner.title}
          </h3>
        </Link>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-content/80">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{practitioner.address || practitioner.country}</span>
          </div>
          <div className="flex items-center text-sm text-content/80">
            <Globe className="h-4 w-4 mr-2" />
            <span>{formatWorkArrangement(practitioner.work_arrangement)}</span>
          </div>
          {price && (
            <div className="flex items-center text-sm text-content/80 mt-2">
              <Coins className="h-4 w-4 mr-2" />
              <span>From {price}</span>
            </div>
          )}
        </div>

        {practitioner.corporate_wellness && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
              Corporate Wellness
            </span>
          </div>
        )}
      </div>
    </div>
  );
}