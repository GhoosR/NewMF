import React, { useState } from 'react';
import { Users, Lock, Calendar, Edit, Trash2, Bell, BellOff, MoreVertical, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../Profile/Avatar';
import { EditCommunityModal } from './EditCommunityModal';
import { MembersListModal } from './MembersListModal';
import { formatDate } from '../../lib/utils/dateUtils';
import { supabase } from '../../lib/supabase';
import type { Community } from '../../types/communities';

interface CommunityHeaderProps {
  community: Community;
  memberCount: number;
  isMember: boolean;
  onJoin: () => void;
}

export function CommunityHeader({ community, memberCount, isMember, onJoin }: CommunityHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const memberMenuRef = React.useRef<HTMLDivElement>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (memberMenuRef.current && !memberMenuRef.current.contains(event.target as Node)) {
        setShowMemberMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === community.owner_id);
      
      if (user) {
        // Check if notifications are enabled
        const { data } = await supabase
          .from('community_notification_settings')
          .select('enabled')
          .eq('community_id', community.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        setNotificationsEnabled(data?.enabled ?? true);
      }
    };

    checkUserStatus();
  }, [community.owner_id, isMember]);

  const toggleNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newState = !notificationsEnabled;

      const { error } = await supabase
        .from('community_notification_settings')
        .upsert({
          community_id: community.id,
          user_id: user.id,
          enabled: newState
        });

      if (error) throw error;
      setNotificationsEnabled(newState);
    } catch (err) {
      console.error('Error toggling notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this community? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', community.id);

      if (error) throw error;
      navigate('/communities');
    } catch (err) {
      console.error('Error deleting community:', err);
      alert('Failed to delete community');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this community?')) {
      return;
    }

    try {
      setIsLeaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', community.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Navigate back to communities page
      navigate('/communities');
    } catch (err) {
      console.error('Error leaving community:', err);
      alert('Failed to leave community. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div>
      {/* Cover Image */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-gray-100 to-gray-200 relative overflow-hidden">
        {community.banner_url && (
          <img
            src={community.banner_url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-24 relative z-10">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              {/* Left: Community Info */}
              <div className="flex items-start space-x-3">
                <div className="relative -mt-0 sm:-mt-0 ring-3 ring-white rounded-full">
                  <Avatar 
                    url={community.avatar_url} 
                    size="lg"
                    userId={community.owner_id}
                    editable={false}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{community.name}</h1>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                      Community
                    </span>
                    {community.type === 'private' && (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-gray-500">
                    <button
                      onClick={() => setShowMembersModal(true)}
                      className="flex items-center text-sm text-content/60 hover:text-accent-text transition-colors"
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span>{memberCount} members</span>
                    </button>
                    <span>•</span>
                    <div>{community.type === 'private' ? 'Private' : 'Public'}</div>
                    <span>•</span>
                    <div>Active {formatDate(community.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 mt-2 sm:mt-0">
                {isOwner ? (
                  <div className="flex items-center gap-2">
                    {isMember && (
                      <button
                        onClick={toggleNotifications}
                        disabled={loading}
                        className="flex items-center px-2.5 py-1 text-sm text-gray-700 hover:text-accent-text"
                      >
                        {notificationsEnabled ? (
                          <Bell className="h-4 w-4 mr-1" />
                        ) : (
                          <BellOff className="h-4 w-4 mr-1" />
                        )}
                        {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex items-center px-2.5 py-1 text-sm text-gray-700 hover:text-accent-text"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-2.5 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                ) : !isMember && (
                  <button
                    onClick={onJoin}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-[#8DA847] hover:bg-[#7A9339] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8DA847]"
                  >
                    {community.type === 'private' ? 'Request to Join' : 'Join Community'}
                  </button>
                )}
                {isMember && !isOwner && (
                  <>
                    {/* Mobile: Show text button */}
                    <button
                      onClick={handleLeave}
                      disabled={isLeaving}
                      className="sm:hidden inline-flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLeaving ? 'Leaving...' : 'Leave'}
                    </button>
                    
                    {/* Desktop: Show three-dots menu */}
                    <div className="hidden sm:block relative" ref={memberMenuRef}>
                      <button
                        onClick={() => setShowMemberMenu(!showMemberMenu)}
                        className="p-3 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      {showMemberMenu && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg py-2 z-10 border border-accent-text/10">
                          <button
                            onClick={() => {
                              handleLeave();
                              setShowMemberMenu(false);
                            }}
                            disabled={isLeaving}
                            className="w-full text-left px-4 py-3 text-base text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50 min-h-[44px]"
                          >
                            <LogOut className="h-5 w-5 mr-3" />
                            {isLeaving ? 'Leaving...' : 'Leave Community'}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-3 sm:mt-4">
              <p className="text-gray-600">{community.description}</p>
            </div>
          </div>

          {/* Organizer Section */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 sm:px-6 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar 
                  url={community.owner?.avatar_url} 
                  size="sm"
                  userId={community.owner_id}
                  editable={false}
                />
                <div>
                  <Link 
                    to={`/profile/${community.owner_id}`}
                    className="text-sm font-medium text-gray-900 hover:text-[#8DA847]"
                  >
                    {community.owner?.full_name || 'Community Owner'}
                  </Link>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {formatDate(community.created_at)}
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Created {formatDate(community.created_at)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditCommunityModal
          community={community}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {showMembersModal && (
        <MembersListModal
          communityId={community.id}
          communityName={community.name}
          isOwner={isOwner}
          onClose={() => setShowMembersModal(false)}
          onMemberRemoved={() => {
            // Refresh the page to update member count
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}