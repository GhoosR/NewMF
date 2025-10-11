import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { NotificationActions } from '../components/Notifications/NotificationActions';
import type { Notification } from '../types/notifications';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch unread notifications first
        const { data: unreadData, error: unreadError } = await supabase
          .from('notifications')
          .select('*')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(100); // Get all unread notifications

        if (unreadError) throw unreadError;
        const unreadNotifications = unreadData || [];
        
        // If we have fewer than 10 total notifications, fetch some read ones
        const remainingSlots = Math.max(0, 10 - unreadNotifications.length);
        let readNotifications: Notification[] = [];
        
        if (remainingSlots > 0) {
          const { data: readData, error: readError } = await supabase
            .from('notifications')
            .select('*')
            .eq('read', true)
            .order('created_at', { ascending: false })
            .limit(remainingSlots);
          
          if (readError) throw readError;
          readNotifications = readData || [];
        }
        
        const allNotifications = [...unreadNotifications, ...readNotifications];
        setNotifications(allNotifications);
        setHasMore(readNotifications.length === remainingSlots && remainingSlots > 0);

        // Fetch avatars for notifications that don't have them
        const notificationsNeedingAvatars = allNotifications.filter(
          n => n.data?.sender_id && !n.data?.sender_avatar_url
        );
        
        if (notificationsNeedingAvatars.length > 0) {
          const senderIds = [...new Set(notificationsNeedingAvatars.map(n => n.data.sender_id))];
          
          const { data: users } = await supabase
            .from('users')
            .select('id, avatar_url')
            .in('id', senderIds);
          
          if (users) {
            const avatarMap = users.reduce((acc, user) => {
              if (user.avatar_url) {
                acc[user.id] = user.avatar_url;
              }
              return acc;
            }, {} as Record<string, string>);
            
            setUserAvatars(avatarMap);
          }
        }

        // Mark all as read
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ read: true })
          .eq('read', false);

        if (updateError) throw updateError;
      } catch (err: any) {
        console.error('Error fetching notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const offset = nextPage * 10;
      
      // Load more read notifications
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + 9); // Load 10 more
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setNotifications(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom && hasMore && !loadingMore) {
      loadMoreNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      setMarkingAllRead(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      await handleRead(notification.id);
      
      // Handle navigation based on notification type
      switch (notification.type) {
        case 'new_message':
        case 'new_group_message': {
          const conversationId = notification.data.conversation_id;
          const conversationType = notification.data.conversation_type;
          if (conversationId) {
            // Navigate differently based on conversation type
            if (conversationType === 'group') {
              // Group messages: use conversation parameter
              window.location.href = `/chat?conversation=${conversationId}`;
            } else {
              // Direct messages: use user ID from conversation data
              const otherUserId = notification.data.other_user_id;
              if (otherUserId) {
                window.location.href = `/chat/${otherUserId}`;
              } else {
                // Fallback to conversation parameter if other_user_id is not available
                window.location.href = `/chat?conversation=${conversationId}`;
              }
            }
          }
          break;
        }
        case 'practitioner_approved':
          if (notification.data.listing_slug) {
            window.location.href = `/practitioners/${notification.data.listing_slug}`;
          }
          break;
        case 'event_approved':
          if (notification.data.listing_slug) {
            window.location.href = `/events/${notification.data.listing_slug}`;
          }
          break;
        case 'venue_approved':
          if (notification.data.listing_slug) {
            window.location.href = `/venues/${notification.data.listing_slug}`;
          }
          break;
        case 'job_approved':
          if (notification.data.listing_slug) {
            window.location.href = `/jobs/${notification.data.listing_slug}`;
          }
          break;
        case 'course_approved':
          if (notification.data.listing_id) {
            window.location.href = `/courses/${notification.data.listing_id}`;
          }
          break;
        case 'recipe_approved':
          if (notification.data.listing_id) {
            // Try to get the recipe slug, fallback to ID
            try {
              const { data: recipe } = await supabase
                .from('recipes')
                .select('slug')
                .eq('id', notification.data.listing_id)
                .single();
              
              if (recipe?.slug) {
                window.location.href = `/recipes/${recipe.slug}`;
              } else {
                window.location.href = `/recipes/${notification.data.listing_id}`;
              }
            } catch (error) {
              // Fallback to ID if slug lookup fails
              window.location.href = `/recipes/${notification.data.listing_id}`;
            }
          }
          break;
        case 'join_request':
        case 'join_request_approved':
        case 'join_request_rejected':
          window.location.href = `/communities/${notification.data.community_id}`;
          break;
        case 'mention':
          if (notification.data.post_type === 'timeline') {
            window.location.href = `/posts/${notification.data.post_id}`;
          } else if (notification.data.post_type === 'community') {
            window.location.href = `/communities/posts/${notification.data.post_id}`;
          }
          break;
        default:
          // Handle other notification types
          break;
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleRead = async (id: string, remove = false) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev => 
        remove ? prev.filter(n => n.id !== id) : prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 bg-background border-b border-accent-text/10 px-4 py-3 flex items-center">
        <Link to="/" className="mr-4">
          <ArrowLeft className="h-6 w-6 text-content/60" />
        </Link>
        <h1 className="text-xl font-semibold text-content flex-1">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAllRead}
            className="text-sm text-accent-text hover:text-accent-text/80 disabled:opacity-50"
          >
            {markingAllRead ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {error ? (
        <div className="p-4 text-red-600">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-content/60">
          No notifications
        </div>
      ) : (
        <div 
          ref={scrollRef}
          className="divide-y divide-accent-text/10 max-h-[70vh] overflow-y-auto"
          onScroll={handleScroll}
        >
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-accent-base/5 cursor-pointer transform transition-all duration-200 ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start">
                {notification.type === 'field_invitation' ? (
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🌱</span>
                  </div>
                ) : (
                  <Avatar
                    url={notification.data?.sender_avatar_url || userAvatars[notification.data?.sender_id]}
                    size="sm"
                    userId={notification.data?.sender_id}
                    editable={false}
                  />
                )}
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-content">
                      {notification.title}
                    </span>
                    <span className="text-xs text-content/40">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-content/80 mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {loadingMore && (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-text"></div>
            </div>
          )}
          
          {!hasMore && notifications.length > 10 && (
            <div className="p-4 text-center text-content/60 text-sm">
              No more notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
}