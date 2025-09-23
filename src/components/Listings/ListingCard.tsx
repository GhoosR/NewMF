import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, MapPin, Building2, BookOpen } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { StatusIndicator } from '../StatusIndicator';
import { supabase } from '../../lib/supabase';

interface ListingCardProps {
  listing: any;
  showStatus?: boolean;
}

export function ListingCard({ listing, showStatus = false }: ListingCardProps) {
  const [isOwner, setIsOwner] = React.useState(false);

  React.useEffect(() => {
    async function checkOwnership() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === listing.user_id);
    }
    checkOwnership();
  }, [listing.user_id]);

  const getIcon = () => {
    switch (listing.type) {
      case 'practitioner': return <User className="h-5 w-5" />;
      case 'event': return <Calendar className="h-5 w-5" />;
      case 'venue': return <MapPin className="h-5 w-5" />;
      case 'job': return <Building2 className="h-5 w-5" />;
      case 'course': return <BookOpen className="h-5 w-5" />;
      default: return null;
    }
  };

  // Ensure we have a valid slug before rendering the link
  const getListingPath = () => {
    if (!listing.slug) {
      console.error('Listing is missing slug:', listing);
      return '#'; // Fallback to prevent undefined route
    }
    return `/${listing.type}s/${listing.slug}`;
  };

  return (
    <div className="bg-background rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Avatar 
            url={listing.user?.avatar_url} 
            size="sm"
            userId={listing.user_id}
            editable={false}
          />
          <div>
            <Username 
              username={listing.user?.username || 'Anonymous'}
              userId={listing.user_id}
              className="font-medium text-content"
            />
            <div className="flex items-center text-sm text-content/60">
              {getIcon()}
              <span className="ml-1 capitalize">{listing.type}</span>
            </div>
          </div>
        </div>
        {(showStatus || isOwner) && listing.approval_status && (
          <StatusIndicator status={listing.approval_status} />
        )}
      </div>

      <h3 className="text-lg font-semibold text-content mb-2">
        {listing.title || listing.name}
      </h3>

      <p className="text-content/80 line-clamp-2">
        {listing.description}
      </p>

      <div className="flex justify-end mt-4">
        <Link
          to={getListingPath()}
          className="text-sm text-accent-text hover:text-accent-text/80"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}