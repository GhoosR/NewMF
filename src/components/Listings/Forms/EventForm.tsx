import React, { useState, useEffect } from 'react';
import { Modal } from '../../Modal';
import { TextArea } from './FormComponents/TextArea';
import { CurrencyInput } from './FormComponents/CurrencyInput';
import { FileInput } from './FormComponents/FileInput';
import { SelectInput } from './FormComponents/SelectInput';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Home, Mail, Users, Globe, Lock } from 'lucide-react';
import { eventTypes } from '../../../lib/constants/eventTypes';
import { europeanCountries } from '../../../lib/constants/countries';
import { supabase } from '../../../lib/supabase';
import type { Community } from '../../../types/communities';

interface EventFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editId?: string;
}

type Step = 'basics' | 'details' | 'tickets' | 'media' | 'community';

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
  { id: 'community', title: 'Community', icon: Users },
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
    ticket_url: '',
    community_id: '',
    visibility: 'public' as 'public' | 'private'
  });
  const [currency, setCurrency] = useState('EUR');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enableTicketSales, setEnableTicketSales] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserCommunities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch communities where user is admin
        const { data: adminCommunities } = await supabase
          .from('community_members')
          .select(`
            community_id,
            communities:community_id (
              id,
              name,
              description,
              type,
              owner_id,
              avatar_url,
              banner_url,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .eq('role', 'admin');

        if (adminCommunities) {
          const communities = adminCommunities.map(member => member.communities).filter(Boolean);
          setUserCommunities(communities as Community[]);
        }
      } catch (error) {
        console.error('Error fetching user communities:', error);
      }
    };

    fetchUserCommunities();
  }, []);

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
      case 'community':
        return true; // Community step is optional
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
        images: imageUrls,
        community_id: formData.community_id || null,
        visibility: formData.visibility
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

      case 'community':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-content mb-4">Community Posting</h3>
              <p className="text-sm text-content/60 mb-6">
                You can post this event to communities you admin. This will make it visible to community members.
              </p>
            </div>

            {userCommunities.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-content mb-2">
                    Post to Community (Optional)
                  </label>
                  <select
                    value={formData.community_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, community_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  >
                    <option value="">No community (standalone event)</option>
                    {userCommunities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.community_id && (
                  <div>
                    <label className="block text-sm font-medium text-content mb-2">
                      Event Visibility
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border border-accent-text/20 rounded-lg cursor-pointer hover:bg-accent-base/5">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={formData.visibility === 'public'}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-green-600" />
                          <div>
                            <div className="font-medium text-content">Public Event</div>
                            <div className="text-sm text-content/60">
                              Visible in events directory and community page
                            </div>
                          </div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-3 border border-accent-text/20 rounded-lg cursor-pointer hover:bg-accent-base/5">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={formData.visibility === 'private'}
                          onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                          className="mr-3"
                        />
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-gray-600" />
                          <div>
                            <div className="font-medium text-content">Private Event</div>
                            <div className="text-sm text-content/60">
                              Only visible in the community page
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-content/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-content mb-2">No Communities Found</h3>
                <p className="text-sm text-content/60 mb-4">
                  You need to be an admin of a community to post events there.
                </p>
                <p className="text-sm text-content/60">
                  This event will be created as a standalone event visible in the events directory.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal title={editId ? "Edit Event" : "Add Event"} onClose={onClose}>
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.id
                  ? 'bg-accent-text text-white'
                  : index < steps.findIndex(s => s.id === currentStep)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep === step.id ? 'text-accent-text font-medium' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-200 mx-4" />
              )}
            </div>
          ))}
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
            ) : currentStep === 'community' ? (
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
      </div>    </Modal>
  );
}