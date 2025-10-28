import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatCategoryName } from '../../lib/utils/formatters';
import type { Venue } from '../../types/venues';

interface VenueCardProps {
  venue: Venue;
  showStatus?: boolean;
}

export function VenueCard({ venue, showStatus = false }: VenueCardProps) {
  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/venues/${venue.slug}`}>
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={venue.images?.[0] || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=400'}
            alt={venue.name}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {venue.user && (
            <Link 
              to={`/profile/${venue.user_id}/listings`}
              className="flex items-center space-x-2 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar 
                url={venue.user.avatar_url} 
                size="sm" 
                userId={venue.user_id}
                editable={false}
              />
              <Username 
                username={venue.user.username || 'Anonymous'}
                userId={venue.user_id}
                className="text-sm text-content group-hover:text-accent-text"
              />
            </Link>
          )}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
              {venue.venue_type ? formatCategoryName(venue.venue_type) : `${venue.capacity} people`}
            </span>
            {showStatus && venue.approval_status === 'pending' && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Pending
              </span>
            )}
          </div>
        </div>

        <Link to={`/venues/${venue.slug}`}>
          <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
            {venue.name}
          </h3>
        </Link>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-content/80">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{venue.address}</span>
          </div>
          <div className="flex items-center text-sm text-content/80">
            <Users className="h-4 w-4 mr-2" />
            <span>Up to {venue.capacity} people</span>
          </div>
          <div className="flex items-center text-sm text-content/80">
            <Clock className="h-4 w-4 mr-2" />
            <span>
              {venue.price 
                ? `${getCurrencySymbol(venue.currency)}${venue.price}/${venue.price_period || 'hour'}`
                : 'Contact for pricing'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {venue.amenities.slice(0, 3).map((amenity, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-accent-base text-accent-text rounded-full"
            >
              {amenity}
            </span>
          ))}
          {venue.amenities.length > 3 && (
            <span className="px-2 py-1 text-xs bg-accent-base text-accent-text rounded-full">
              +{venue.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
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