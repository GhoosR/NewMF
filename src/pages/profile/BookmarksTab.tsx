import React, { useState, useEffect } from 'react';
import { Bookmark, User, Calendar, Building2, MapPin, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PractitionerCard } from '../../components/Listings/PractitionerCard';
import { EventCard } from '../../components/Events/EventCard';
import { VenueCard } from '../../components/Venues/VenueCard';
import { JobCard } from '../../components/Jobs/JobCard';
import { Avatar } from '../../components/Profile/Avatar';
import { Username } from '../../components/Profile/Username';
import { Link } from 'react-router-dom';

interface BookmarksTabProps {
  userId: string;
}

type BookmarkType = 'all' | 'practitioners' | 'events' | 'venues' | 'jobs' | 'profiles' | 'posts';

interface Bookmark {
  id: string;
  target_id: string;
  target_type: BookmarkType;
  created_at: string;
}

export function BookmarksTab({ userId }: BookmarksTabProps) {
  const [activeType, setActiveType] = useState<BookmarkType>('all');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        setLoading(true);
        setError(null);

        let bookmarksData;
        let bookmarksError;

        if (activeType === 'all') {
          // Fetch all bookmarks
          const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          bookmarksData = data;
          bookmarksError = error;
        } else if (activeType === 'posts') {
          // Fetch both timeline_posts and community_posts
          const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .in('target_type', ['timeline_posts', 'community_posts'])
            .order('created_at', { ascending: false });
          bookmarksData = data;
          bookmarksError = error;
        } else {
          // Fetch bookmarks for the selected type
          const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', userId)
            .eq('target_type', activeType)
            .order('created_at', { ascending: false });
          bookmarksData = data;
          bookmarksError = error;
        }

        if (bookmarksError) throw bookmarksError;
        setBookmarks(bookmarksData || []);

        if (bookmarksData?.length) {
          const targetIds = bookmarksData.map(b => b.target_id);

          if (activeType === 'all') {
            // Group bookmarks by type and fetch all items
            const bookmarksByType = bookmarksData.reduce((acc, bookmark) => {
              if (!acc[bookmark.target_type]) {
                acc[bookmark.target_type] = [];
              }
              acc[bookmark.target_type].push(bookmark.target_id);
              return acc;
            }, {} as Record<string, string[]>);

            const allItems = [];
            
            // Fetch each type of bookmarked item
            for (const [type, ids] of Object.entries(bookmarksByType)) {
              let query;
              switch (type) {
                case 'practitioners':
                  query = supabase
                    .from('practitioners')
                    .select(`*, user:users!practitioners_user_id_fkey(*)`)
                    .in('id', ids);
                  break;
                case 'events':
                  query = supabase
                    .from('events')
                    .select(`*, user:users!events_user_id_fkey(*)`)
                    .in('id', ids);
                  break;
                case 'venues':
                  query = supabase
                    .from('venues')
                    .select(`*, user:users!venues_user_id_fkey(*)`)
                    .in('id', ids);
                  break;
                case 'jobs':
                  query = supabase
                    .from('job_offers')
                    .select(`*, user:users!job_offers_user_id_fkey(*)`)
                    .in('id', ids);
                  break;
                case 'profiles':
                  query = supabase
                    .from('users')
                    .select('*')
                    .in('id', ids);
                  break;
                case 'timeline_posts':
                case 'community_posts':
                  query = supabase
                    .from(type)
                    .select(`*, user:users!${type}_user_id_fkey(*)`)
                    .in('id', ids);
                  break;
              }
              
              if (query) {
                const { data: items, error: itemsError } = await query;
                if (itemsError) throw itemsError;
                // Add type information to each item
                const itemsWithType = (items || []).map(item => ({ ...item, _bookmarkType: type }));
                allItems.push(...itemsWithType);
              }
            }
            
            setBookmarkedItems(allItems);
          } else if (activeType === 'posts') {
            // Fetch both timeline_posts and community_posts
            const timelineIds = bookmarksData.filter(b => b.target_type === 'timeline_posts').map(b => b.target_id);
            const communityIds = bookmarksData.filter(b => b.target_type === 'community_posts').map(b => b.target_id);
            
            const allPosts = [];
            
            if (timelineIds.length > 0) {
              const { data: timelinePosts, error: timelineError } = await supabase
                .from('timeline_posts')
                .select(`*, user:users!timeline_posts_user_id_fkey(*)`)
                .in('id', timelineIds);
              
              if (timelineError) throw timelineError;
              const postsWithType = (timelinePosts || []).map(post => ({ ...post, _bookmarkType: 'timeline_posts' }));
              allPosts.push(...postsWithType);
            }
            
            if (communityIds.length > 0) {
              const { data: communityPosts, error: communityError } = await supabase
                .from('community_posts')
                .select(`*, user:users!community_posts_user_id_fkey(*)`)
                .in('id', communityIds);
              
              if (communityError) throw communityError;
              const postsWithType = (communityPosts || []).map(post => ({ ...post, _bookmarkType: 'community_posts' }));
              allPosts.push(...postsWithType);
            }
            
            setBookmarkedItems(allPosts);
          } else {
            // Fetch the actual items based on type
            let query;
            switch (activeType) {
              case 'practitioners':
                query = supabase
                  .from('practitioners')
                  .select(`*, user:users!practitioners_user_id_fkey(*)`)
                  .in('id', targetIds);
                break;
              case 'events':
                query = supabase
                  .from('events')
                  .select(`*, user:users!events_user_id_fkey(*)`)
                  .in('id', targetIds);
                break;
              case 'venues':
                query = supabase
                  .from('venues')
                  .select(`*, user:users!venues_user_id_fkey(*)`)
                  .in('id', targetIds);
                break;
              case 'jobs':
                query = supabase
                  .from('job_offers')
                  .select(`*, user:users!job_offers_user_id_fkey(*)`)
                  .in('id', targetIds);
                break;
              case 'profiles':
                query = supabase
                  .from('users')
                  .select('*')
                  .in('id', targetIds);
                break;
            }

            if (query) {
              const { data: items, error: itemsError } = await query;
              if (itemsError) throw itemsError;
              setBookmarkedItems(items || []);
            }
          }
        } else {
          setBookmarkedItems([]);
        }
      } catch (err: any) {
        console.error('Error fetching bookmarks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBookmarks();
  }, [userId, activeType]);

  const handleRemoveBookmark = async (targetId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('target_id', targetId)
        .eq('target_type', activeType);

      if (error) throw error;

      // Update local state
      setBookmarks(prev => prev.filter(b => b.target_id !== targetId));
      setBookmarkedItems(prev => prev.filter(item => item.id !== targetId));
    } catch (err: any) {
      console.error('Error removing bookmark:', err);
      alert('Failed to remove bookmark. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-content">Bookmarks</h2>

      {/* Type Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveType('all')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'all'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          All Bookmarks
        </button>
        <button
          onClick={() => setActiveType('practitioners')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'practitioners'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <User className="h-4 w-4 mr-2" />
          Practitioners
        </button>
        <button
          onClick={() => setActiveType('events')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'events'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Events
        </button>
        <button
          onClick={() => setActiveType('venues')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'venues'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Venues
        </button>
        <button
          onClick={() => setActiveType('jobs')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'jobs'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Jobs
        </button>
        <button
          onClick={() => setActiveType('posts')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'posts'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Posts
        </button>
        <button
          onClick={() => setActiveType('profiles')}
          className={`flex items-center px-4 py-2 rounded-lg ${
            activeType === 'profiles'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          <User className="h-4 w-4 mr-2" />
          Profiles
        </button>
      </div>

      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
        </div>
      ) : bookmarkedItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Bookmark className="h-12 w-12 text-content/20 mx-auto mb-4" />
          <p className="text-content/60">No bookmarks yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeType === 'all' || activeType === 'practitioners') && 
            bookmarkedItems.map(practitioner => (
              (activeType !== 'all' || practitioner._bookmarkType === 'practitioners') && (
                <PractitionerCard key={practitioner.id} practitioner={practitioner} />
              )
            ))
          }
          {(activeType === 'all' || activeType === 'events') && 
            bookmarkedItems.map(event => (
              (activeType !== 'all' || event._bookmarkType === 'events') && (
                <EventCard key={event.id} event={event} />
              )
            ))
          }
          {(activeType === 'all' || activeType === 'venues') && 
            bookmarkedItems.map(venue => (
              (activeType !== 'all' || venue._bookmarkType === 'venues') && (
                <VenueCard key={venue.id} venue={venue} />
              )
            ))
          }
          {(activeType === 'all' || activeType === 'jobs') && 
            bookmarkedItems.map(job => (
              (activeType !== 'all' || job._bookmarkType === 'job_offers') && (
                <JobCard key={job.id} job={job} />
              )
            ))
          }
          {(activeType === 'all' || activeType === 'posts') && 
            bookmarkedItems.map(post => (
              (activeType !== 'all' || ['timeline_posts', 'community_posts'].includes(post._bookmarkType)) && (
                <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start space-x-3">
                    <Avatar 
                      url={post.user?.avatar_url} 
                      size="sm"
                      userId={post.user_id}
                      editable={false}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Username 
                          username={post.user?.username || 'Anonymous'}
                          userId={post.user_id}
                          className="font-medium text-content"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-content/60">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {activeType === 'all' && (
                            <span className="px-2 py-0.5 text-xs bg-accent-base/20 text-accent-text rounded-full">
                              {post._bookmarkType === 'timeline_posts' ? 'Timeline' : 'Community'}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-content/80">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {post.images.slice(0, 2).map((image, index) => (
                            <img 
                              key={index}
                              src={image}
                              alt="Post image"
                              className="rounded-lg w-full h-32 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      <Link 
                        to={post._bookmarkType === 'timeline_posts' ? `/posts/${post.id}` : `/communities/posts/${post.id}`}
                        className="mt-3 inline-block text-sm text-accent-text hover:text-accent-text/80"
                      >
                        View Post
                      </Link>
                    </div>
                  </div>
                </div>
              )
            ))
          }
          {(activeType === 'all' || activeType === 'profiles') && 
            bookmarkedItems.map(profile => (
              (activeType !== 'all' || profile._bookmarkType === 'profiles') && (
                <div key={profile.id} className="bg-white rounded-lg shadow-sm p-6">
                  <Link 
                    to={`/profile/${profile.id}/listings`}
                    className="flex items-center space-x-4 group"
                  >
                    <Avatar 
                      url={profile.avatar_url} 
                      size="md"
                      userId={profile.id}
                      editable={false}
                    />
                    <div>
                      <Username 
                        username={profile.username}
                        userId={profile.id}
                        className="text-lg font-medium text-content group-hover:text-accent-text"
                      />
                      {profile.full_name && (
                        <p className="text-content/60">{profile.full_name}</p>
                      )}
                    </div>
                  </Link>
                </div>
              )
            ))
          }
        </div>
      )}
    </div>
  );
}