import React, { useState, useEffect } from 'react';
import { X, Leaf, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FileInput } from '../Listings/Forms/FormComponents/FileInput';
import { TextArea } from '../Listings/Forms/FormComponents/TextArea';
import { Modal } from '../Modal';

interface CreateCommunityModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'type' | 'details' | 'media' | 'review';

export function CreateCommunityModal({ onClose, onSuccess }: CreateCommunityModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public'
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images if provided
      let avatarUrl = '';
      let bannerUrl = '';

      if (avatar) {
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from('community-images')
          .upload(`${user.id}/${Date.now()}-avatar`, avatar);
        
        if (avatarError) throw avatarError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(avatarData.path);
        
        avatarUrl = publicUrl;
      }

      if (banner) {
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from('community-images')
          .upload(`${user.id}/${Date.now()}-banner`, banner);
        
        if (bannerError) throw bannerError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(bannerData.path);
        
        bannerUrl = publicUrl;
      }

      // Create community
      const { data: community, error: insertError } = await supabase
        .from('communities')
        .insert([{
          name: formData.name,
          description: formData.description,
          type: formData.type,
          owner_id: user.id,
          avatar_url: avatarUrl,
          banner_url: bannerUrl
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert([{
          community_id: community.id,
          user_id: user.id,
          role: 'admin'
        }]);

      if (memberError) throw memberError;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'type', label: 'Type' },
    { id: 'details', label: 'Details' },
    { id: 'media', label: 'Media' },
    { id: 'review', label: 'Review' }
  ];

  const isStepComplete = (step: Step): boolean => {
    switch (step) {
      case 'type':
        return !!formData.type;
      case 'details':
        return !!formData.name && !!formData.description;
      case 'media':
        return true; // Media is optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const handleNext = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as Step);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as Step);
    }
  };

  return (
    <Modal title="Create Community" onClose={onClose} fullScreenOnMobile={true}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep === step.id
                  ? 'border-accent-text bg-accent-text text-white'
                  : 'border-accent-text/20 text-content/60'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-full h-0.5 mx-2 ${
                  index < steps.findIndex(s => s.id === currentStep)
                    ? 'bg-accent-text'
                    : 'bg-accent-text/20'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <span key={step.id} className="text-sm text-content/60">
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {currentStep === 'type' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-content">Choose Community Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'public' }))}
                className={`p-6 text-left border-2 rounded-lg transition-colors ${
                  formData.type === 'public'
                    ? 'border-accent-text bg-accent-base/5'
                    : 'border-accent-text/20 hover:border-accent-text hover:bg-accent-base/5'
                }`}
              >
                <h4 className="text-lg font-medium text-content mb-2">Public Community</h4>
                <p className="text-content/60">
                  Anyone can join and participate in discussions. Content is visible to all members.
                </p>
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, type: 'private' }))}
                className={`p-6 text-left border-2 rounded-lg transition-colors ${
                  formData.type === 'private'
                    ? 'border-accent-text bg-accent-base/5'
                    : 'border-accent-text/20 hover:border-accent-text hover:bg-accent-base/5'
                }`}
              >
                <h4 className="text-lg font-medium text-content mb-2">Private Community</h4>
                <p className="text-content/60">
                  Members must request to join. Content is only visible to approved members.
                </p>
              </button>
            </div>
          </div>
        )}

        {currentStep === 'details' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-content">Community Details</h3>
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Community Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Enter community name"
              />
            </div>

            <TextArea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Describe your community..."
              required
            />
          </div>
        )}

        {currentStep === 'media' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-content">Community Media</h3>
            <FileInput
              label="Community Avatar"
              onChange={(files) => setAvatar(files[0])}
              maxFiles={1}
              maxSize={2}
              accept="image/*"
              description="Upload a profile picture for your community"
            />

            <FileInput
              label="Community Banner"
              onChange={(files) => setBanner(files[0])}
              maxFiles={1}
              maxSize={2}
              accept="image/*"
              description="Upload a banner image for your community"
            />
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-content">Review Details</h3>
            <div className="bg-accent-base/5 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="text-sm font-medium text-content">Community Type</h4>
                <p className="text-content/80 capitalize">{formData.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-content">Name</h4>
                <p className="text-content/80">{formData.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-content">Description</h4>
                <p className="text-content/80">{formData.description}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <h4 className="text-sm font-medium text-content">Avatar</h4>
                  {avatar ? (
                    <div className="mt-2 w-16 h-16 rounded-full overflow-hidden">
                      <img
                        src={URL.createObjectURL(avatar)}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-content/60">No avatar selected</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-content">Banner</h4>
                  {banner ? (
                    <div className="mt-2 w-32 h-16 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(banner)}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <p className="text-content/60">No banner selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep !== 'type' ? (
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
            disabled={!canProceed || loading}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
          >
            {loading ? (
              'Creating...'
            ) : currentStep === 'review' ? (
              'Create Community'
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