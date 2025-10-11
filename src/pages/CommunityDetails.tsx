import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Calendar, MessageSquare, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CommunityHeader } from '../components/Communities/CommunityHeader';
import { CreatePostForm } from '../components/Communities/CreatePostForm';
import { CommunityPost } from '../components/Communities/CommunityPost';
import { CommunityEventForm } from '../components/Communities/CommunityEventForm';
import { CommunityEventCard } from '../components/Communities/CommunityEventCard';
import { AboutCommunityForm } from '../components/Communities/AboutCommunityForm';
import { AboutCommunityDisplay } from '../components/Communities/AboutCommunityDisplay';
import { createJoinRequest } from '../lib/communities/joinRequests';
import type { Community, CommunityPost as CommunityPostType } from '../types/communities';
import type { Event } from '../types/events';

export function CommunityDetails() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPostType[]>([]);
  const [events, setEvents] = useState<(Event & { pinned?: boolean; pinned_at?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberCount, setMemberCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'about'>('posts');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAboutForm, setShowAboutForm] = useState(false);
  const [aboutData, setAboutData] = useState<{
    about_text?: string;
    team_members?: any[];
  } | null>(null);

  const fetchData = async () => {
    if (!id) return;

    try {
      // Get community details with owner info and about data
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select(`
          *,
          owner:users!communities_owner_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);
      
      // Set about data
      setAboutData({
        about_text: communityData.about_text,
        team_members: communityData.team_members || []
      });

      // Get member count
      const { count, error: countError } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', id);

      if (countError) throw countError;
      setMemberCount(count || 0);

      // Check if user is a member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsMember(!!memberData);
        setIsAdmin(memberData?.role === 'admin');

        // If member, fetch posts and events
        if (memberData) {
          // Fetch posts
          const { data: postsData, error: postsError } = await supabase
            .from('community_posts')
            .select(`
              *,
              user:users!community_posts_user_id_fkey (
                username,
                avatar_url
              ),
              _count: community_post_comments (count)
            `)
            .eq('community_id', id)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;
          setPosts(postsData || []);

          // Fetch events
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select(`
              *,
              user:users!events_user_id_fkey (
                id,
                username,
                avatar_url,
                full_name
              )
            `)
            .eq('community_id', id)
            .order('pinned', { ascending: false })
            .order('start_date', { ascending: true });

          if (eventsError) throw eventsError;
          setEvents(eventsData || []);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleJoin = async () => {
    if (!community) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (community.type === 'private') {
        await createJoinRequest(community.id);
        alert('Join request sent successfully');
      } else {
        const { error } = await supabase
          .from('community_members')
          .insert([{
            community_id: community.id,
            user_id: user.id,
            role: 'member'
          }]);

        if (error) throw error;
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePinPost = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('pin_community_post', {
        post_id: postId,
        community_id: id
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnpinPost = async (postId: string) => {
    try {
      const { error } = await supabase.rpc('unpin_community_post', {
        post_id: postId,
        community_id: id
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePinEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.rpc('pin_community_event', {
        event_id: eventId,
        community_id: id
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnpinEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.rpc('unpin_community_event', {
        event_id: eventId,
        community_id: id
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-content">
            {error || 'Community not found'}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommunityHeader 
        community={community}
        memberCount={memberCount}
        isMember={isMember}
        onJoin={handleJoin}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isMember ? (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'posts'
                    ? 'border-accent-text text-accent-text'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Posts
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'events'
                    ? 'border-accent-text text-accent-text'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'about'
                    ? 'border-accent-text text-accent-text'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                About
              </button>
            </div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <>
                <CreatePostForm communityId={community.id} onSuccess={fetchData} />
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-500">No posts yet. Be the first to share something!</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <CommunityPost 
                        key={post.id} 
                        post={post}
                        isAdmin={isAdmin}
                        onPin={() => handlePinPost(post.id)}
                        onUnpin={() => handleUnpinPost(post.id)}
                        onDelete={() => {
                          // Remove the post from local state immediately for better UX
                          setPosts(prev => prev.filter(p => p.id !== post.id));
                          // Then refresh to ensure consistency
                          fetchData();
                        }}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <>
                {isAdmin && (
                  <div className="mb-6">
                    <button
                      onClick={() => setShowEventForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-md hover:bg-accent-text/90 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </button>
                  </div>
                )}
                <div className="space-y-6">
                  {events.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                      <p className="text-gray-500">
                        {isAdmin ? 'No events yet. Create the first event!' : 'No events scheduled yet.'}
                      </p>
                    </div>
                  ) : (
                    events.map((event) => (
                      <CommunityEventCard
                        key={event.id}
                        event={event}
                        isAdmin={isAdmin}
                        onPin={() => handlePinEvent(event.id)}
                        onUnpin={() => handleUnpinEvent(event.id)}
                      />
                    ))
                  )}
                </div>
              </>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
                    <AboutCommunityDisplay
                      aboutText={aboutData?.about_text}
                      teamMembers={aboutData?.team_members}
                      isAdmin={isAdmin}
                      onEdit={() => setShowAboutForm(true)}
                    />
            )}
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Join this community to see posts and participate in discussions.</p>
          </div>
        )}
      </div>

      {showEventForm && (
        <CommunityEventForm
          communityId={community.id}
          onClose={() => setShowEventForm(false)}
          onSuccess={() => {
            setShowEventForm(false);
            fetchData();
          }}
        />
      )}

      {showAboutForm && (
        <AboutCommunityForm
          communityId={community.id}
          currentAbout={aboutData}
          onClose={() => setShowAboutForm(false)}
          onSuccess={() => {
            setShowAboutForm(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}