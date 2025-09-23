import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { TextArea } from './FormComponents/TextArea';
import { CurrencyInput } from './FormComponents/CurrencyInput';
import { FileInput } from './FormComponents/FileInput';
import { SelectInput } from './FormComponents/SelectInput';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Home, Mail } from 'lucide-react';
import { eventTypes } from '../../../lib/constants/eventTypes';
import { europeanCountries } from '../../../lib/constants/countries';
import { supabase } from '../../../lib/supabase';

interface EventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editId?: string;
}

type Step = 'basics' | 'details' | 'tickets' | 'media';

interface StepConfig {
  id: Step;
  title: string;
  icon: React.ComponentType<any>;
}

const steps: StepConfig[] = [
  { id: 'basics', title: 'Basic Info', icon: Calendar },
  { id: 'details', title: 'Details', icon: MapPin },
  { id: 'tickets', title: 'Tickets', icon: Home },
  { id: 'media', title: 'Media', icon: Mail },
];

export function EventForm({ onClose, onSuccess, editId }: EventFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    country: '',
    price: '',
    ticket_url: ''
  });
  const [currency, setCurrency] = useState('EUR');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableTicketSales, setEnableTicketSales] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (editId) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', editId)
            .single();

          if (error) throw error;
          if (!data) throw new Error('Event not found');

          const startDate = new Date(data.start_date);
          const endDate = new Date(data.end_date);
          
          const formatDateForInput = (date: Date) => {
            return date.toISOString().split('T')[0];
          };
          
          const formatTimeForInput = (date: Date) => {
            return date.toISOString().split('T')[1].substring(0, 5);
          };

          setFormData({
            title: data.title,
            description: data.description,
            event_type: data.event_type,
            start_date: formatDateForInput(startDate),
            start_time: formatTimeForInput(startDate),
            end_date: formatDateForInput(endDate),
            end_time: formatTimeForInput(endDate),
            location: data.location,
            country: data.country || '',
            price: data.price ? data.price.toString() : '',
            ticket_url: data.ticket_url || ''
          });
          
          setEnableTicketSales(!!data.price && data.price > 0);
          setCurrency('EUR');
          
          if (data.images && data.images.length > 0) {
            setExistingImageUrls(data.images);
          } else if (data.image_url) {
            setExistingImageUrls([data.image_url]);
          }
        } catch (err: any) {
          console.error('Error fetching event:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [editId]);

  const isStepValid = () => {
    switch (currentStep) {
      case 'basics':
        return formData.title && formData.description && formData.event_type;
      case 'details':
        return formData.start_date && formData.start_time && formData.end_date && 
               formData.end_time && formData.location && formData.country;
      case 'tickets':
        return !enableTicketSales || (formData.price && formData.ticket_url);
      case 'media':
        return true;
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
    if (!isStepValid()) return;

    setLoading(true);
    setError('');

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrls: string[] = [];
      
      if (images.length > 0) {
        const uploadedImageUrls = await Promise.all(
        images.map(async (file) => {
          const { data, error } = await supabase.storage
            .from('event-images')
            .upload(`${user.id}/${Date.now()}-${file.name}`, file);
          
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(data.path);
          
          return publicUrl;
        })
        );
        imageUrls = [...uploadedImageUrls];
      } else if (existingImageUrls.length > 0) {
        imageUrls = existingImageUrls;
      }

      const eventData = {
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: formData.location,
        country: formData.country,
        price: enableTicketSales ? parseFloat(formData.price) || 0 : 0,
        ticket_url: enableTicketSales ? formData.ticket_url : null,
        image_url: imageUrls[0],
        images: imageUrls
      };

      let error;
      
      if (editId) {
        const { error: updateError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editId);
        
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('events')
          .insert([eventData]);
        
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
              <label className="block text-sm font-medium text-content mb-2">Event Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Enter event title"
              />
            </div>

            <SelectInput
              label="Event Type"
              value={formData.event_type}
              onChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
              options={eventTypes}
              required
            />

            <TextArea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe your event..."
              required
            />
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">Start Time *</label>
                <input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-content mb-2">End Time *</label>
                <input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                />
              </div>
            </div>

            <SelectInput
              label="Country"
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              options={europeanCountries}
              required
            />

            <div>
              <label className="block text-sm font-medium text-content mb-2">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Event location"
              />
            </div>
          </div>
        );

      case 'tickets':
        return (
          <div className="space-y-6">
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTicketSales}
                  onChange={(e) => setEnableTicketSales(e.target.checked)}
                  className="rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
                />
                <span className="text-sm font-medium text-content">Enable ticket sales</span>
              </label>
            </div>

            {enableTicketSales && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CurrencyInput
                  label="Ticket Price"
                  amount={formData.price}
                  currency={currency}
                  onAmountChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
                  onCurrencyChange={setCurrency}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-content mb-2">Ticket URL</label>
                  <input
                    type="url"
                    value={formData.ticket_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, ticket_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    placeholder="External ticket purchase link"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'media':
        return (
          <div className="space-y-6">
            <FileInput
              label="Event Images"
              onChange={setImages}
              maxFiles={5}
              maxSize={2}
              accept="image/*"
              multiple
              description="Upload images for your event (max 5 images)"
            />
            <div className="flex flex-wrap gap-4">
              {images.map((file, index) => (
                <div key={index} className="relative">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              {images.length === 0 && existingImageUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative">
                  <img
                    src={url}
                    alt={`Existing ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                  <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    ✓
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <Modal title={editId ? "Edit Event" : "Add Event"} onClose={onClose} fullScreenOnMobile={true}>
      <div className="mb-8">
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

      <div className="mb-8">
        {renderStepContent()}
      </div>

      {error && (
        <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

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
              editId ? 'Update Event' : 'Create Event'
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