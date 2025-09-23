import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { PractitionerForm } from './Forms/PractitionerForm';
import { EventForm } from './Forms/EventForm';
import { VenueForm } from './Forms/VenueForm';
import { JobForm } from './Forms/JobForm';
import { CheckCircle } from 'lucide-react';
import { isProfessional } from '../../lib/auth/authService';

const LISTING_TYPES = [
  { id: 'practitioner', label: 'Practitioner' },
  { id: 'event', label: 'Event' },
  { id: 'venue', label: 'Venue' },
  { id: 'job', label: 'Job' },
];

interface AddListingModalProps {
  onClose: () => void;
  editId?: string;
  editType?: string;
  onSuccess?: () => void;
}

export function AddListingModal({ onClose, editId, editType, onSuccess }: AddListingModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [canCreateListing, setCanCreateListing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If editing, set the selected type
    if (editType) {
      setSelectedType(editType);
    }
    
    const checkAccess = async () => {
      const hasProfessionalAccess = await isProfessional();
      setCanCreateListing(hasProfessionalAccess);
      setLoading(false);
    };
    checkAccess();
  }, [editType]);

  if (loading) {
    return null;
  }

  if (!canCreateListing) {
    onClose();
    return null;
  }

  const handleClose = () => {
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thank You for Your Submission!
          </h3>
          <p className="text-gray-600 mb-6">
            Your listing has been submitted for review. We'll notify you once it's approved.
          </p>
          <button
            onClick={handleClose}
            className="w-full px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    setShowSuccess(true);
  };

  const renderForm = () => {
    switch (selectedType) {
      case 'practitioner':
        return <PractitionerForm onClose={onClose} onSuccess={handleSuccess} editId={editId} />;
      case 'event':
        return <EventForm onClose={onClose} onSuccess={handleSuccess} editId={editId} />;
      case 'venue':
        return <VenueForm onClose={onClose} onSuccess={handleSuccess} editId={editId} />;
      case 'job':
        return <JobForm onClose={onClose} onSuccess={handleSuccess} editId={editId} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full h-full md:h-auto md:max-w-4xl md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"> 
          <h2 className="text-2xl font-semibold text-content">
            {selectedType ? (editId ? `Edit ${selectedType} Listing` : `Add ${selectedType} Listing`) : 'Choose Listing Type'}
          </h2>
          <button onClick={onClose} className="text-content/60 hover:text-content/80">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!selectedType ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LISTING_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="p-6 text-left border border-accent-text/20 rounded-lg hover:border-accent-text hover:bg-accent-base/50 transition-colors"
              >
                <h3 className="text-lg font-medium text-content">{type.label}</h3>
                <p className="mt-2 text-sm text-content/80">
                  Create a new {type.label.toLowerCase()} listing
                </p>
              </button>
            ))}
          </div>
        ) : (
          renderForm()
        )}
      </div>
    </div> 
  );
}