import React, { useState, useEffect } from 'react';
import { Pencil, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Avatar } from './Avatar';
import { EditProfileModal } from './EditProfileModal'; 
import { Username } from './Username';
import { BookmarkButton } from '../BookmarkButton';
import { BlockButton } from './BlockButton';
import type { Profile } from '../../lib/profile';

interface ProfileHeaderProps {
  profile: Profile;
  onUpdate: () => void;
  isEditable: boolean;
}

export function ProfileHeader({ profile, onUpdate, isEditable }: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-col items-center text-center">
        <Avatar 
          url={profile.avatar_url} 
          size="lg"
          username={profile.username}
          onUpdate={onUpdate}
          editable={isEditable}
        />
        
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-content flex items-center justify-center gap-2">
            <Username 
              username={profile.username}
              userId={profile.id}
              verified={profile.verified}
              className="text-content"
            />
          </h1>
          {profile.full_name && (
            <p className="text-content/60 text-sm mt-1">{profile.full_name}</p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          {isEditable ? (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-content border border-content/20 rounded-full hover:bg-content/5"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit profile
            </button>
          ) : isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/chat/${profile.id}`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-full hover:bg-accent-text/90"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Message
              </button>
              <BlockButton userId={profile.id} />
              <BookmarkButton targetId={profile.id} targetType="profiles" />
            </div>
          )}
          {!isAuthenticated && !isEditable && (
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-full hover:bg-accent-text/90"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Sign in to Message
            </button>
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 text-content/80 max-w-lg text-center">
            {profile.bio}
          </p>
        )}

        {showEditModal && (
          <EditProfileModal
            profile={profile}
            onClose={() => setShowEditModal(false)}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </div>
  );
}