import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X, ChevronLeft, ChevronRight, Upload, User, Check } from 'lucide-react';

type OnboardingStep = 'interests' | 'profile-picture' | 'complete';

// Official group owner ID
const OFFICIAL_OWNER_ID = '8a5791a8-8dbc-4c49-a146-f5768d0007ed';

export function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('interests');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  const fetchCommunities = async () => {
    try {
      console.log('🔍 Fetching communities...');
      setCommunitiesLoading(true);
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          avatar_url,
          owner_id,
          type
        `)
        .eq('type', 'public') // Only show public communities for onboarding
        .order('name');

      console.log('📊 Communities data:', communitiesData);
      console.log('❌ Communities error:', communitiesError);

      if (communitiesError) {
        console.error('Communities error:', communitiesError);
        throw communitiesError;
      }
      
      setCommunities(communitiesData || []);
      console.log('✅ Communities loaded:', communitiesData?.length || 0);
    } catch (err: any) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities. Please refresh the page.');
    } finally {
      setCommunitiesLoading(false);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      try {
        console.log('🔍 Fetching user in onboarding...');
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('👤 User data:', user);
        console.log('❌ Auth error:', error);
        
        if (error) {
          console.error('Auth error:', error);
          setError('Authentication error. Please try signing in again.');
          return;
        }
        
        if (!user) {
          console.log('❌ No user found, redirecting to home');
          navigate('/');
          return;
        }
        
        console.log('✅ User found:', user.id);
        setUser(user);
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Failed to load user data. Please try again.');
      }
    };
    getUser();
    fetchCommunities();
  }, [navigate]);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setProfilePictureUrl(url);
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

  const joinCommunitiesForInterests = async (selectedCommunityIds: string[]) => {
    try {
      console.log('🔗 Starting to join communities:', selectedCommunityIds);
      
      if (selectedCommunityIds.length === 0) {
        console.log('⚠️ No communities selected, skipping join process');
        return;
      }
      
      const communitiesToJoin = selectedCommunityIds.map(communityId => ({
        user_id: user.id,
        community_id: communityId,
        role: 'member'
      }));

      console.log('📝 Communities to join:', communitiesToJoin);

      const { error } = await supabase
        .from('community_members')
        .insert(communitiesToJoin);
      
      if (error) {
        console.error('❌ Error joining communities:', error);
        throw error;
      } else {
        console.log('✅ Successfully joined communities:', selectedCommunityIds);
      }
    } catch (error) {
      console.error('❌ Error in joinCommunitiesForInterests:', error);
      throw error;
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
      console.log('🔗 Joining communities:', selectedInterests);
      await joinCommunitiesForInterests(selectedInterests);
      
      // Clear the onboarding flags to allow normal navigation
      await supabase.auth.updateUser({
        data: { 
          needsOnboarding: false,
          isNewUser: false 
        }
      });
      
      // Redirect to profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (userProfile?.username) {
        navigate(`/profile/${userProfile.username}`);
      } else {
        navigate('/');
      }
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
      console.log('🔗 Joining communities:', selectedInterests);
      await joinCommunitiesForInterests(selectedInterests);
      
      // Clear the onboarding flags to allow normal navigation
      await supabase.auth.updateUser({
        data: { 
          needsOnboarding: false,
          isNewUser: false 
        }
      });
      
      // Redirect to profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (userProfile?.username) {
        navigate(`/profile/${userProfile.username}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'profile-picture') {
      setCurrentStep('interests');
    } else if (currentStep === 'complete') {
      setCurrentStep('profile-picture');
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'interests':
        return 'Join Communities';
      case 'profile-picture':
        return 'Add a profile picture';
      case 'complete':
        return 'Welcome to Mindful Family!';
      default:
        return '';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'interests':
        return 1;
      case 'profile-picture':
        return 2;
      case 'complete':
        return 3;
      default:
        return 1;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Go to Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Welcome to Mindful Family</h1>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {getStepNumber()} of 3</span>
              <span>{Math.round((getStepNumber() / 3) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-accent-text h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getStepNumber() / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 'interests' && (
            <div>
              <p className="text-gray-600 mb-6">
                Select the communities you'd like to join. This helps us personalize your experience and connect you with like-minded people.
              </p>
              
              {communitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading communities...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => handleInterestToggle(community.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedInterests.includes(community.id)
                          ? 'border-accent-text bg-accent-text/5 text-accent-text'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {community.avatar_url ? (
                          <img 
                            src={community.avatar_url} 
                            alt={community.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{community.name}</div>
                          {community.owner_id === OFFICIAL_OWNER_ID && (
                            <span className="inline-block px-2 py-0.5 bg-accent-text/10 text-accent-text text-xs rounded-full mt-1">
                              Official
                            </span>
                          )}
                        </div>
                        {selectedInterests.includes(community.id) && (
                          <Check className="h-5 w-5 ml-auto text-accent-text" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {communities.length === 0 && !communitiesLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No communities available at the moment.</p>
                  <p className="text-sm text-gray-400 mt-1">You can skip this step and join communities later.</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'profile-picture' && (
            <div>
              <p className="text-gray-600 mb-6">
                Add a profile picture to help others recognize you in the community. You can skip this step if you prefer.
              </p>
              
              <div className="text-center">
                <div className="relative inline-block">
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
                  
                  <label className="absolute bottom-0 right-0 bg-accent-text text-white rounded-full p-2 cursor-pointer hover:bg-accent-text/90 transition-colors">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <p className="mt-4 text-sm text-gray-500">
                  Click the upload icon to add a photo
                </p>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                You're all set!
              </h3>
              
              <p className="text-gray-600 mb-6">
                Welcome to Mindful Family! We've set up your profile and connected you with communities based on your interests.
              </p>
              
              {selectedInterests.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">You've joined these communities:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map(communityId => {
                      const community = communities.find(c => c.id === communityId);
                      return (
                        <span key={communityId} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent-text/10 text-accent-text">
                          {community?.avatar_url ? (
                            <img 
                              src={community.avatar_url} 
                              alt={community.name}
                              className="w-4 h-4 rounded-full mr-2 object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 mr-2" />
                          )}
                          {community?.name || 'Unknown Community'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 'interests'}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex space-x-3">
              {currentStep === 'profile-picture' && (
                <button
                  onClick={handleSkip}
                  disabled={loading}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              )}
              
              {currentStep === 'complete' ? (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="px-8 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Finishing...</span>
                    </>
                  ) : (
                    <>
                      <span>Get Started</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={currentStep === 'interests' && selectedInterests.length === 0}
                  className="px-6 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
