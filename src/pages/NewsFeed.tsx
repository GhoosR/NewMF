import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CreateTimelinePost } from '../components/Timeline/CreateTimelinePost';
import { formatDate, formatTime } from '../lib/utils/dateUtils';
import { NewsFeedSidebar } from '../components/Home/NewsFeedSidebar';
import { TimelineList } from '../components/Timeline/TimelineList';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import type { TimelinePost } from '../types/timeline';
import type { Event } from '../types/events';
import { useAdmin } from '../lib/hooks/useAdmin';
import { Link } from 'react-router-dom';

export function NewsFeed() {
  const { isAdmin } = useAdmin();
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcomingEvents = async () => {
    try {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .eq('approval_status', 'approved')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(3);

      if (eventsError) throw eventsError;
      setUpcomingEvents(events || []);
    } catch (err) {
      console.error('Error fetching upcoming events:', err);
      setError('Failed to load upcoming events. Please try again later.');
    }
  };

  useEffect(() => {
    fetchPosts(0);
    fetchUpcomingEvents();
  }, []);

  const fetchPosts = async (pageNumber: number, append = false) => {
    try {
      setError(null);
      setLoading(true);

      // Check authentication before fetching
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('timeline_posts')
        .select(`
          *,
          user:users!timeline_posts_user_id_fkey (
            username,
            avatar_url
          ),
          _count: timeline_post_comments(count)
        `)
        .order('created_at', { ascending: false })
        .range(pageNumber * 10, (pageNumber + 1) * 10 - 1);

      if (fetchError) throw fetchError;

      if (append) {
        setPosts(prev => [...prev, ...(data || [])]);
      } else {
        setPosts(data || []);
      }
      
      setHasMore((data?.length || 0) === 10);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchPosts(nextPage, true);
    setPage(nextPage);
  };

  const observerRef = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMorePosts,
    threshold: 0.5
  });

  const handlePostSuccess = () => {
    fetchPosts(0); // Refresh the timeline
  };

  const handlePostDelete = () => {
    fetchPosts(0); // Refresh the timeline after deletion
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-content">Upcoming Events</h2>
                <Link to="/events" className="text-sm text-accent-text hover:text-accent-text/80">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.slug}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative group"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <img
                        src={event.image_url || 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=400'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    </div>
                    
                    <div className="p-4 relative z-10">
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center mb-3 shadow-sm">
                        <span className="text-lg font-bold text-accent-text">
                          {new Date(event.start_date).getDate()}
                        </span>
                        <span className="text-sm text-accent-text">
                          {new Date(event.start_date).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate mb-2 drop-shadow-sm">{event.title}</h3>
                      <div className="flex items-center text-sm text-white/90">
                        <span className="truncate drop-shadow-sm">{event.location}</span>
                        <span className="mx-2">•</span>
                        <span className="drop-shadow-sm">{formatTime(new Date(event.start_date))}</span>
                      </div>
                      {event.price > 0 ? (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-accent-text backdrop-blur-sm shadow-sm">
                            €{event.price}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/90 text-white backdrop-blur-sm shadow-sm">
                            Free
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <CreateTimelinePost onSuccess={handlePostSuccess} />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 border-t border-b border-red-100">
              {error}
            </div>
          )}

          <TimelineList 
            posts={posts}
            loadingMore={loading && posts.length > 0}
            hasMore={hasMore}
            observerRef={observerRef}
            onPostDelete={handlePostDelete}
          />

          {loading && posts.length === 0 && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
            </div>
          )}

          {!loading && posts.length === 0 && !error && (
            <div className="text-center py-12 text-content/60">
              No posts yet. Be the first to share something!
            </div>
          )}
        </div>
        
        {/* Sidebar - Only visible on desktop */}
        <div className="hidden lg:block">
          <NewsFeedSidebar />
        </div>
      </div>
    </div>
  );
}