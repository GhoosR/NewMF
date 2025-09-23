import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile as ProfileType } from '../lib/profile';
import { ProfileHeader } from '../components/Profile/ProfileHeader';
import { ProfileTabs } from '../components/Profile/ProfileTabs';
import { ListingsTab } from './profile/ListingsTab';
import { TimelineTab } from './profile/TimelineTab';
import { MediaTab } from './profile/MediaTab';
import { BookmarksTab } from './profile/BookmarksTab';
import { CoursesTab } from './profile/CoursesTab';
import { RecipesTab } from './profile/RecipesTab';
import { PaymentSettingsTab } from './profile/PaymentSettings';

// Array of gradient backgrounds
const gradients = [
  'from-[#E0F2F1]',
  'from-[#F3E5F5]',
  'from-[#E8F5E9]',
  'from-[#FFF3E0]',
  'from-[#E3F2FD]',
  'from-[#F3E5F5]',
];

export default function Profile() {
  const { username, '*': splat } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradient] = useState(() => gradients[Math.floor(Math.random() * gradients.length)]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!username) {
        // Redirect to home if no username available
        navigate('/', { replace: true });
        return;
      }

      // Check if the username parameter is actually a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);
      
      // Fetch profile data
      const query = supabase
        .from('users')
        .select('id, username, full_name, avatar_url, banner_url, bio, created_at, updated_at, verified');
      
      // Query by ID if it's a UUID, otherwise by username
      const { data: profileData, error: profileError } = isUUID 
        ? await query.eq('id', username).single()
        : await query.eq('username', username).single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('Profile not found');
        } else {
          throw profileError;
        }
        return;
      }

      if (!profileData) {
        setError('Profile not found');
        return;
      }

      // Set if this is the current user's profile
      setIsOwnProfile(currentUser?.id === profileData.id);

      // Check if current user is admin
      if (currentUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', currentUser.id)
          .single();
        
        setIsAdmin(!!userData?.is_admin);
      }

      setProfile(profileData);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error || 'Profile not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="text-accent-text hover:text-accent-text/80"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className={`bg-gradient-to-b ${gradient} to-[#f9fafc] h-32`} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <ProfileHeader 
          profile={profile} 
          onUpdate={fetchProfile} 
          isEditable={isOwnProfile}
        />
        <div className="mt-6">
          <ProfileTabs userId={profile.id} username={profile.username} />
          <div className="mt-6">
            <Routes>
              <Route path="listings/*" element={<ListingsTab userId={profile.id} />} />
              <Route path="timeline" element={<TimelineTab username={profile.username} />} />
              {isOwnProfile && <Route path="bookmarks" element={<BookmarksTab userId={profile.id} />} />}
              <Route path="recipes" element={<RecipesTab userId={profile.id} />} />
              {isAdmin && <Route path="courses" element={<CoursesTab userId={profile.id} />} />}
              {isOwnProfile && (
                <Route path="payment-settings" element={<PaymentSettingsTab userId={profile.id} />} />
              )}
              <Route path="/" element={<Navigate to="listings" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}