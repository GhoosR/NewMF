import React, { useState } from 'react';
import { Modal } from '../../Modal';
import { TextArea } from './FormComponents/TextArea';
import { MultiSelect } from './FormComponents/MultiSelect';
import { SelectInput } from './FormComponents/SelectInput';
import { FileInput } from './FormComponents/FileInput';
import { ArrowLeft, ArrowRight, Building2, MapPin, Home, Mail } from 'lucide-react';
import { venueTypes } from '../../../lib/constants/venueTypes';
import { amenities } from '../../../lib/constants/amenities';
import { europeanCountries } from '../../../lib/constants/countries';
import { supabase } from '../../../lib/supabase';
import type { Venue } from '../../../types/venues';

interface VenueFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editVenue?: Venue | null;
}

type Step = 'basics' | 'location' | 'amenities' | 'media';

interface StepConfig {
  id: Step;
  title: string;
  icon: React.ComponentType<any>;
}

const steps: StepConfig[] = [
  { id: 'basics', title: 'Basic Info', icon: Building2 },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'amenities', title: 'Features', icon: Home },
  { id: 'media', title: 'Media', icon: Mail },
];

export function VenueForm({ onClose, onSuccess, editVenue }: VenueFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [formData, setFormData] = useState(() => {
    return {
      name: editVenue?.name || '',
      venue_type: editVenue?.venue_type || '',
      description: editVenue?.description || '',
      country: editVenue?.country || '',
      address: editVenue?.address || '',
      amenities: editVenue?.amenities || [] as string[],
      capacity: editVenue?.capacity?.toString() || '',
      price: editVenue?.price?.toString() || '',
      price_period: editVenue?.price_period || 'hour',
      currency: editVenue?.currency || 'EUR',
      contact_email: editVenue?.contact_email || '',
      contact_phone: editVenue?.contact_phone || '',
      sleeping_places: editVenue?.sleeping_places || '0',
      bedrooms: editVenue?.bedrooms || '0',
      bathrooms: editVenue?.bathrooms || '0',
      kitchens: editVenue?.kitchens || '0'
    };
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>(editVenue?.images || []);

  const isStepValid = () => {
    switch (currentStep) {
      case 'basics':
        return formData.name && formData.venue_type && formData.description;
      case 'location':
        return formData.country && formData.address && formData.capacity && formData.price;
      case 'amenities':
        return formData.amenities.length > 0;
      case 'media':
        return formData.contact_email; // Only email is required
    }
  };

  const handleNext = () => {
    if (!isStepValid()) {
      setError('Please fill in all required fields');
      return;
    }
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    } else {
      handleSubmit();
    }
    setError('');
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images if any
      const imageUrls = await Promise.all(
        images.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('venue-images')
            .upload(`${user.id}/${Date.now()}-${file.name}`, file);
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('venue-images')
            .getPublicUrl(data.path);
          
          return publicUrl;
        })
      );

      // Prepare venue data
      const venueData = {
          user_id: user.id,
          name: formData.name,
          venue_type: formData.venue_type,
          description: formData.description,
          country: formData.country,
          address: formData.address,
          amenities: formData.amenities,
          capacity: parseInt(formData.capacity),
          price: formData.price ? parseFloat(formData.price) : null,
          price_period: formData.price_period,
          currency: formData.currency,
          images: [...existingImages, ...imageUrls],
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          sleeping_places: formData.sleeping_places,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          kitchens: formData.kitchens
      };

      let error;
      
      if (editVenue) {
        // Update existing venue
        const { error: updateError } = await supabase
          .from('venues')
          .update(venueData)
          .eq('id', editVenue.id);
        
        error = updateError;
      } else {
        // Create new venue
        const { error: insertError } = await supabase
          .from('venues')
          .insert([venueData]);
        
        error = insertError;
      }

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Venue Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Enter venue name"
              />
            </div>

            <SelectInput
              label="Venue Type"
              value={formData.venue_type}
              onChange={(value) => setFormData(prev => ({ ...prev, venue_type: value }))}
              options={venueTypes}
              required
            />

            <TextArea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe your venue..."
              required
            />
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <SelectInput
              label="Country"
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              options={europeanCountries}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Street address, City"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">Capacity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="Maximum number of people"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">Price</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                     value={formData.price || ''}
                     onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      placeholder="Leave empty to hide price"
                    />
                  </div>
                  <div>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <select
                     value={formData.price_period || 'hour'}
                     onChange={(e) => setFormData(prev => ({ ...prev, price_period: e.target.value as 'hour' | 'day' | 'week' }))}
                      className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    >
                      <option value="hour">Per Hour</option>
                      <option value="day">Per Day</option>
                      <option value="week">Per Week</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'amenities':
        return (
          <div className="space-y-6">
            <MultiSelect
              label="Amenities"
              options={amenities}
              selectedValues={formData.amenities}
              onChange={(values) => setFormData(prev => ({ ...prev, amenities: values }))}
              required
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">Sleeping Places</label>
                <input
                  type="number"
                  min="0"
                  value={formData.sleeping_places}
                  onChange={(e) => setFormData(prev => ({ ...prev, sleeping_places: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">Bedrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">Bathrooms</label>
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">Kitchens</label>
                <input
                  type="number"
                  min="0"
                  value={formData.kitchens}
                  onChange={(e) => setFormData(prev => ({ ...prev, kitchens: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <FileInput
              label="Venue Images"
              onChange={(files) => setImages(files)}
              maxFiles={5}
              accept="image/*"
              multiple
              description="Upload images of your venue (max 5 images, will be automatically compressed)"
            />
            
            {existingImages.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-content mb-2">Existing Images</h3>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Venue image ${index + 1}`} 
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">Contact Email *</label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal title={editVenue ? "Edit Venue" : "Add Venue"} onClose={onClose} fullScreenOnMobile={true}>
      {/* Progress Steps */}
      <div className="mb-8">
        {/* Desktop Steps */}
        <div className="hidden md:block">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors p-3
                    ${isActive || isPast 
                      ? 'border-accent-text bg-accent-text text-white' 
                      : 'border-accent-text/20 text-content/60'
                    }
                  `}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-0.5 mx-2 ${
                      isPast ? 'bg-accent-text' : 'bg-accent-text/20'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <span key={step.id} className="text-xs text-content/60 w-20 text-center">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Mobile Steps */}
        <div className="md:hidden flex items-center justify-between mb-4">
          <span className="text-sm text-content/60">Step {steps.findIndex(s => s.id === currentStep) + 1} of {steps.length}</span>
          <span className="text-sm font-medium text-content">{steps.find(s => s.id === currentStep)?.title}</span>
        </div>
        <div className="md:hidden bg-accent-base/10 rounded-full h-2 mb-6">
          <div 
            className="h-full bg-accent-text rounded-full transition-all duration-300"
            style={{ 
              width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {error && (
        <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep !== 'basics' ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center px-4 py-2 text-sm font-medium text-content hover:text-content/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        ) : (
          <div></div>
        )}
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={loading || !isStepValid()}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
          >
            {loading ? (
              'Creating...'
            ) : currentStep === 'media' ? (
              editVenue ? 'Update Venue' : 'Create Venue'
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}