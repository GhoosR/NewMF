import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, User, X, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchBar } from '../Search/SearchBar';
import { CreatePostForm } from '../Communities/CreatePostForm';
import { Avatar } from '../Profile/Avatar';
import type { Community } from '../../types/communities';

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const fetchUserCommunities = async () => {
    if (!userId) return;
    
    try {
      const { data: communities, error } = await supabase
        .from('community_members')
        .select(`
          communities:community_id (
            id,
            name,
            description,
            type,
            avatar_url,
            banner_url
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      const communitiesList = communities?.map(member => member.communities).filter(Boolean) as Community[] || [];
      setUserCommunities(communitiesList);
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  React.useEffect(() => {
    // Check auth status
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      }
    };
    getUserProfile();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUsername(data.username);
            }
          });
      } else {
        setUserId(null);
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch communities when userId changes
  React.useEffect(() => {
    if (userId) {
      fetchUserCommunities();
    }
  }, [userId]);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('show-auth'));
    }
  };
  
  const handleMessageClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('show-auth'));
    } else {
      setShowSearch(false);
    }
  };

  const handleNavigationClick = () => {
    setShowSearch(false);
    setShowCommunitiesModal(false);
    setShowCreatePost(false);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('show-auth'));
      return;
    }
    setShowCommunitiesModal(true);
  };

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
    setShowCommunitiesModal(false);
    setShowCreatePost(true);
  };

  const handlePostSuccess = (postId?: string) => {
    setShowCreatePost(false);
    setSelectedCommunity(null);
    
    // Navigate to the created post if postId is provided
    if (postId) {
      navigate(`/communities/posts/${postId}`);
    }
  };

  return (
    <>
      {showSearch ? (
        <div className="fixed top-0 left-0 right-0 bottom-16 bg-white z-40 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
            <h2 className="text-lg font-medium text-content">Search</h2>
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SearchBar onResultClick={() => setShowSearch(false)} />
          </div>
        </div>
      ) : null}
      
      {/* Bottom Navigation - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent-text/10 lg:hidden z-50 h-16 shadow-lg">
        <nav className="flex items-center justify-around h-16">
          <Link
            to="/"
            onClick={handleNavigationClick}
            aria-label="Home"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname === '/' ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            <Home className="h-6 w-6" />
          </Link>

          <button
            onClick={handlePlusClick}
            aria-label="Create Post"
            className="flex items-center justify-center w-14 h-14 rounded-full text-content/60"
          >
            <Plus className="h-6 w-6" />
          </button>

          <Link
            to="/chat"
            onClick={handleMessageClick}
            aria-label="Messages"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname.includes('/chat') ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            <MessageSquare className="h-6 w-6" />
          </Link>

          <Link
            to={username ? `/profile/${username}/listings` : '#'}
            onClick={(e) => {
              handleProfileClick(e);
              handleNavigationClick();
            }}
            aria-label="Profile"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname.includes('/profile') ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            {isAuthenticated && userId ? (
              <Avatar userId={userId} size="sm" />
            ) : (
              <User className="h-6 w-6" />
            )}
          </Link>
        </nav>
      </div>

      {/* Communities Selection Modal - Full Page */}
      {showCommunitiesModal && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
            <h2 className="text-lg font-medium text-content">Select Community</h2>
            <button
              onClick={() => setShowCommunitiesModal(false)}
              className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {userCommunities.length === 0 ? (
                <div className="text-center py-8 text-content/60">
                  <p>You haven't joined any communities yet.</p>
                  <Link 
                    to="/communities" 
                    className="text-accent-text hover:text-accent-text/80 mt-2 inline-block"
                    onClick={() => setShowCommunitiesModal(false)}
                  >
                    Browse Communities
                  </Link>
                </div>
              ) : (
                userCommunities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => handleCommunitySelect(community)}
                    className="w-full p-4 text-left border border-accent-text/20 rounded-lg hover:bg-accent-base/10 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {community.avatar_url ? (
                        <img 
                          src={community.avatar_url} 
                          alt={community.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent-base/20 flex items-center justify-center">
                          <span className="text-accent-text font-medium text-sm">
                            {community.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-content">{community.name}</h3>
                        {community.description && (
                          <p className="text-sm text-content/60 mt-1 line-clamp-2">
                            {community.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal - Full Page */}
      {showCreatePost && selectedCommunity && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
            <h2 className="text-lg font-medium text-content">Post to {selectedCommunity.name}</h2>
            <button
              onClick={() => setShowCreatePost(false)}
              className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CreatePostForm 
              communityId={selectedCommunity.id} 
              onSuccess={handlePostSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}