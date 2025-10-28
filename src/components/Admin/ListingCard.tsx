import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, MapPin, Building2, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { CertificatePreview } from './CertificatePreview';
import type { AdminListing } from '../../types/admin';

interface ListingCardProps {
  listing: AdminListing;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ListingCard({ listing, onApprove, onReject }: ListingCardProps) {
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

  const showCertificate = listing.type === 'practitioner' && listing.certification_url;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
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
        <div className="flex items-center space-x-2">
          {onApprove && (
            <button
              onClick={onApprove}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title="Approve"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Reject"
            >
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-content mb-2">
        {listing.title || listing.name}
      </h3>

      <p className="text-content/80 line-clamp-2 mb-4">
        {listing.description}
      </p>

      {showCertificate && (
        <CertificatePreview url={listing.certification_url} />
      )}

      <div className="flex justify-end mt-4">
        <Link
          to={`/${listing.type}s/${listing.slug}`}
          className="text-sm text-accent-text hover:text-accent-text/80"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}