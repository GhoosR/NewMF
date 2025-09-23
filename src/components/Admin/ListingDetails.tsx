import React from 'react';
import { X, User, Calendar, MapPin, Building2, CheckCircle, XCircle } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import type { AdminListing } from '../../types/admin';
import { formatWorkArrangement } from '../../lib/utils/formatters';

interface ListingDetailsProps {
  listing: AdminListing;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ListingDetails({ listing, onClose, onApprove, onReject }: ListingDetailsProps) {
  const getIcon = () => {
    switch (listing.type) {
      case 'practitioner':
        return <User className="h-5 w-5" />;
      case 'event':
        return <Calendar className="h-5 w-5" />;
      case 'venue':
        return <MapPin className="h-5 w-5" />;
      case 'job':
        return <Building2 className="h-5 w-5" />;
    }
  };

  const renderPractitionerDetails = () => {
    if (listing.type !== 'practitioner') return null;
    return (
      <>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Category</h3>
          <p className="text-content/80">{listing.category}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Work Arrangement</h3>
          <p className="text-content/80">{formatWorkArrangement(listing.work_arrangement)}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Location</h3>
          <p className="text-content/80">{listing.address || listing.country}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Languages</h3>
          <p className="text-content/80">{listing.language}</p>
        </div>

        {listing.price_list && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-content mb-2">Price List</h3>
            <pre className="text-content/80 whitespace-pre-wrap">{listing.price_list}</pre>
          </div>
        )}

        {listing.certification_url && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-content mb-2">Certification</h3>
            <a 
              href={listing.certification_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent-text hover:underline"
            >
              View Certification
            </a>
          </div>
        )}
      </>
    );
  };

  const renderEventDetails = () => {
    if (listing.type !== 'event') return null;
    return (
      <>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Event Type</h3>
          <p className="text-content/80">{listing.event_type}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Date & Time</h3>
          <p className="text-content/80">
            From: {new Date(listing.start_date).toLocaleString()}<br />
            To: {new Date(listing.end_date).toLocaleString()}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Location</h3>
          <p className="text-content/80">{listing.location}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Price</h3>
          <p className="text-content/80">€{listing.price}</p>
        </div>

        {listing.max_participants && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-content mb-2">Capacity</h3>
            <p className="text-content/80">{listing.max_participants} participants</p>
          </div>
        )}
      </>
    );
  };

  const renderVenueDetails = () => {
    if (listing.type !== 'venue') return null;
    return (
      <>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Address</h3>
          <p className="text-content/80">{listing.address}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Capacity</h3>
          <p className="text-content/80">{listing.capacity} people</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Price</h3>
          <p className="text-content/80">€{listing.price_per_hour}/hour</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 text-sm bg-accent-base text-accent-text rounded-full"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Contact</h3>
          <p className="text-content/80">
            Email: {listing.contact_email}<br />
            {listing.contact_phone && <>Phone: {listing.contact_phone}</>}
          </p>
        </div>
      </>
    );
  };

  const renderJobDetails = () => {
    if (listing.type !== 'job') return null;
    return (
      <>
        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Company</h3>
          <p className="text-content/80">{listing.company_name}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Job Type</h3>
          <p className="text-content/80">{listing.job_type}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Location</h3>
          <p className="text-content/80">{listing.location}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Salary Range</h3>
          <p className="text-content/80">{listing.salary_range}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Requirements</h3>
          <div className="flex flex-wrap gap-2">
            {listing.requirements.map((req, index) => (
              <span
                key={index}
                className="px-2 py-1 text-sm bg-accent-base text-accent-text rounded-full"
              >
                {req}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Contact</h3>
          <p className="text-content/80">{listing.contact_email}</p>
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <Avatar 
              url={listing.user?.avatar_url} 
              size="sm"
              userId={listing.user_id}
              editable={false}
            />
            <div>
              <span className="font-medium text-content">
                {listing.user?.username || 'Anonymous'}
              </span>
              <div className="flex items-center text-sm text-content/60">
                {getIcon()}
                <span className="ml-1 capitalize">{listing.type}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-content/60 hover:text-content">
            <X className="h-6 w-6" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-content mb-6">
          {listing.type === 'venue' ? listing.name : listing.title}
        </h2>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-content mb-2">Description</h3>
          <p className="text-content/80 whitespace-pre-line">{listing.description}</p>
        </div>

        {renderPractitionerDetails()}
        {renderEventDetails()}
        {renderVenueDetails()}
        {renderJobDetails()}

        {listing.images && listing.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-content mb-2">Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {listing.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="rounded-lg w-full h-48 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          {onReject && (
            <button
              onClick={onReject}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject
            </button>
          )}
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex items-center px-4 py-2 text-green-600 hover:bg-green-50 rounded-md"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Approve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}