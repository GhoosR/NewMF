import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Upload, User, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OnboardingModalProps {
  onClose: () => void;
  onComplete: () => void;
}

type OnboardingStep = 'interests' | 'profile-picture' | 'complete';

// Define interest categories based on platform communities
const interestCategories = [
  {
    id: 'yoga',
    name: 'Yoga',
    icon: '🧘‍♀️',
    description: 'Yoga practices and communities',
    communityName: 'Yoga Community'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    icon: '🧘‍♂️',
    description: 'Mindfulness and meditation',
    communityName: 'Meditation Community'
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    icon: '🥗',
    description: 'Healthy eating and nutrition',
    communityName: 'Nutrition Community'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: '💪',
    description: 'Physical wellness and exercise',
    communityName: 'Fitness Community'
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    icon: '🧠',
    description: 'Mental wellness and therapy',
    communityName: 'Mental Health Community'
  },
  {
    id: 'alternative-medicine',
    name: 'Alternative Medicine',
    icon: '🌿',
    description: 'Holistic and alternative healing',
    communityName: 'Alternative Medicine Community'
  },
  {
    id: 'spirituality',
    name: 'Spirituality',
    icon: '✨',
    description: 'Spiritual growth and practices',
    communityName: 'Spirituality Community'
  },
  {
    id: 'nature',
    name: 'Nature & Outdoors',
    icon: '🌲',
    description: 'Nature therapy and outdoor activities',
    communityName: 'Nature & Outdoors Community'
  },
  {
    id: 'cooking',
    name: 'Cooking',
    icon: '👨‍🍳',
    description: 'Healthy cooking and recipes',
    communityName: 'Cooking Community'
  },
  {
    id: 'art-therapy',
    name: 'Art Therapy',
    icon: '🎨',
    description: 'Creative and artistic wellness',
    communityName: 'Art Therapy Community'
  },
  {
    id: 'music',
    name: 'Music & Sound',
    icon: '🎵',
    description: 'Sound healing and music therapy',
    communityName: 'Music & Sound Community'
  },
  {
    id: 'community',
    name: 'Community',
    icon: '👥',
    description: 'Building wellness communities',
    communityName: 'Community Building'
  }
];

export function OnboardingModal({ onClose, onComplete }: OnboardingModalProps) {
  console.log('🎊 ONBOARDING MODAL COMPONENT RENDERED!');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('interests');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setProfilePicture(file);
      setError('');
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePictureUrl(previewUrl);
    }
  };

  const joinCommunitiesForInterests = async (interests: string[]) => {
    if (!user || interests.length === 0) return;

    try {
      // Get all communities
      const { data: communities, error: communitiesError } = await supabase
        .from('communities')
        .select('id, name, type');

      if (communitiesError) throw communitiesError;

      // Find communities that match selected interests
      const communitiesToJoin = communities.filter(community => {
        return interests.some(interestId => {
          const category = interestCategories.find(cat => cat.id === interestId);
          if (!category) return false;
          return community.name.toLowerCase().includes(category.name.toLowerCase()) ||
                 community.name.toLowerCase().includes(category.communityName.toLowerCase());
        });
      });

      // Join each matching community
      for (const community of communitiesToJoin) {
        try {
          // Check if user is already a member
          const { data: existingMember } = await supabase
            .from('community_members')
            .select('id')
            .eq('community_id', community.id)
            .eq('user_id', user.id)
            .single();

          if (!existingMember) {
            // Join the community
            const { error: joinError } = await supabase
              .from('community_members')
              .insert([{
                community_id: community.id,
                user_id: user.id,
                role: 'member'
              }]);

            if (joinError) {
              console.error(`Failed to join community ${community.name}:`, joinError);
            }
          }
        } catch (error) {
          console.error(`Error joining community ${community.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error joining communities:', error);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'interests') {
      setCurrentStep('profile-picture');
    } else if (currentStep === 'profile-picture') {
      setCurrentStep('complete');
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      let avatarUrl = null;
      
      // Upload profile picture if selected
      if (profilePicture) {
        avatarUrl = await uploadProfilePicture(profilePicture);
      }
      
      // Complete onboarding
      const { error } = await supabase.rpc('complete_user_onboarding', {
        user_id: user.id,
        final_interests: selectedInterests,
        avatar_url: avatarUrl
      });
      
      if (error) {
        console.error('Error calling complete_user_onboarding:', error);
        // Fallback: update user directly
        const { error: updateError } = await supabase
          .from('users')
          .update({
            interests: selectedInterests,
            avatar_url: avatarUrl,
            onboarding_completed: true,
            onboarding_step: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }
      
      // Join communities based on selected interests
      await joinCommunitiesForInterests(selectedInterests);
      
      // Clear the needsOnboarding flag to allow redirect
      await supabase.auth.updateUser({
        data: { needsOnboarding: false }
      });
      
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.rpc('complete_user_onboarding', {
        user_id: user.id,
        final_interests: selectedInterests
      });
      
      if (error) {
        console.error('Error calling complete_user_onboarding:', error);
        // Fallback: update user directly
        const { error: updateError } = await supabase
          .from('users')
          .update({
            interests: selectedInterests,
            onboarding_completed: true,
            onboarding_step: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (updateError) throw updateError;
      }
      
      // Join communities based on selected interests
      await joinCommunitiesForInterests(selectedInterests);
      
      // Clear the needsOnboarding flag to allow redirect
      await supabase.auth.updateUser({
        data: { needsOnboarding: false }
      });
      
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'interests':
        return 'What interests you?';
      case 'profile-picture':
        return 'Add a profile picture';
      case 'complete':
        return 'Welcome to Mindful Family!';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'interests':
        return 'Choose topics that interest you to personalize your experience';
      case 'profile-picture':
        return 'Upload a photo to help others recognize you (optional)';
      case 'complete':
        return 'You\'re all set! Start exploring your personalized feed.';
      default:
        return '';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'interests':
        return true; // Can always proceed, even with no interests
      case 'profile-picture':
        return true; // Can always proceed, picture is optional
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {currentStep !== 'interests' && (
              <button
                onClick={() => {
                  if (currentStep === 'profile-picture') {
                    setCurrentStep('interests');
                  } else if (currentStep === 'complete') {
                    setCurrentStep('profile-picture');
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{getStepTitle()}</h2>
              <p className="text-sm text-gray-600">{getStepDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            {['interests', 'profile-picture', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? 'bg-accent-text text-white'
                      : index < ['interests', 'profile-picture', 'complete'].indexOf(currentStep)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < ['interests', 'profile-picture', 'complete'].indexOf(currentStep) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < ['interests', 'profile-picture', 'complete'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 'interests' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleInterestToggle(category.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedInterests.includes(category.id)
                        ? 'border-accent-text bg-accent-base/5'
                        : 'border-gray-200 hover:border-accent-text/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                  </button>
                ))}
              </div>
              
              {selectedInterests.length > 0 && (
                <div className="mt-4 p-3 bg-accent-base/5 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Selected:</strong> {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'profile-picture' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-accent-text text-white rounded-full flex items-center justify-center hover:bg-accent-text/90 transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-accent-text hover:text-accent-text/80 font-medium"
                  >
                    {profilePicture ? 'Change photo' : 'Upload photo'}
                  </button>
                  <p className="text-sm text-gray-600 mt-1">
                    JPG, PNG up to 5MB
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Mindful Family!
                </h3>
                <p className="text-gray-600">
                  Your profile is set up and ready. You can always update your interests and photo later in your profile settings.
                </p>
              </div>
              
              {selectedInterests.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Your interests:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(interestId => {
                      const category = interestCategories.find(c => c.id === interestId);
                      return category ? (
                        <span
                          key={interestId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm text-gray-700 border"
                        >
                          <span>{category.icon}</span>
                          {category.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {currentStep === 'profile-picture' && (
              <button
                onClick={handleSkip}
                disabled={loading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
              >
                Skip
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep === 'complete' ? (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Get Started
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="px-6 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
