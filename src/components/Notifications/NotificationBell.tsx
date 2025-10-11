import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { NotificationsList } from './NotificationsList';
import type { Notification } from '../../types/notifications';

export function NotificationBell() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;
  const channelRef = useRef<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const initializeNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        try {
          // Quickly fetch unread count first
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('read', false);
          
          setUnreadCount(count || 0);
          setLoading(false);
          
          // Then set up subscription and fetch initial notifications
          await subscribeToNotifications(user.id);
        } catch (err) {
          console.error('Error initializing notifications:', err);
          setLoading(false);
        }
      }
    };

    initializeNotifications();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      
      if (newUserId) {
        setLoading(true);
        setInitialLoad(true);
        subscribeToNotifications(newUserId);
      } else if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  // Close dropdown when navigating to different pages
  useEffect(() => {
    const handleLocationChange = () => {
      setShowDropdown(false);
    };

    // Listen for route changes (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);
    
    // Listen for programmatic navigation (Link clicks, navigate() calls)
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleLocationChange();
    };

    // Listen for Link component navigation
    const handleLinkClick = () => {
      setTimeout(handleLocationChange, 0); // Delay to ensure navigation completes
    };
    
    // Add event listener for all link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]');
      if (link && !link.getAttribute('href')?.startsWith('#')) {
        handleLinkClick();
      }
    });
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const subscribeToNotifications = async (uid: string) => {
    // Fetch unread notifications first
    console.log('Fetching notifications for user:', uid);
    const { data: unreadData, error: unreadError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(50); // Get all unread notifications

    console.log('Unread notifications:', unreadData, unreadError);

    const unreadNotifications = unreadData || [];
    
    // If we have fewer than 10 total notifications, fetch some read ones
    const remainingSlots = Math.max(0, 10 - unreadNotifications.length);
    let readNotifications: Notification[] = [];
    
    if (remainingSlots > 0) {
      const { data: readData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .eq('read', true)
        .order('created_at', { ascending: false })
        .limit(remainingSlots);
      
      readNotifications = readData || [];
    }
    
    const allNotifications = [...unreadNotifications, ...readNotifications];
    setNotifications(allNotifications);
    setHasMore(readNotifications.length === remainingSlots && remainingSlots > 0);
    setPage(0);
    
    // Fetch avatars for notifications that need them
    await fetchMissingAvatars(allNotifications);
    
    setLoading(false);
    setInitialLoad(false);

    // Subscribe to new notifications
    channelRef.current = supabase
      .channel(`notifications:${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to both INSERT and UPDATE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          if (payload.eventType === 'INSERT') {
            // Handle new notifications
            if (notification.type === 'new_message' || notification.type === 'new_group_message') {
              setNotifications(prev => {
                // Remove any existing message notification for the same conversation
                const filtered = prev.filter(n => 
                  !((n.type === 'new_message' || n.type === 'new_group_message') && 
                    n.data?.conversation_id === notification.data?.conversation_id)
                );
                return [notification, ...filtered];
              });
            } else {
              setNotifications(prev => [notification, ...prev]);
            }
            setUnreadCount(prev => prev + 1);
          } else if (payload.eventType === 'UPDATE') {
            // Handle notification updates (like message notifications being updated)
            setNotifications(prev => {
              return prev.map(n => n.id === notification.id ? notification : n);
            });
          } else if (payload.eventType === 'DELETE') {
            // Handle notification deletions
            const deletedId = payload.old?.id;
            if (deletedId) {
              setNotifications(prev => prev.filter(n => n.id !== deletedId));
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }

          // Show browser notification if supported
          if (payload.eventType === 'INSERT' && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/vite.svg'
            });
          }
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Function to fetch missing avatars
  const fetchMissingAvatars = async (notificationList: Notification[]) => {
    const notificationsNeedingAvatars = notificationList.filter(
      n => n.data?.sender_id && !n.data?.sender_avatar_url
    );
    
    if (notificationsNeedingAvatars.length > 0) {
      const senderIds = [...new Set(notificationsNeedingAvatars.map(n => n.data.sender_id))];
      
      try {
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
          
          setUserAvatars(prev => ({ ...prev, ...avatarMap }));
        }
      } catch (err) {
        console.error('Error fetching avatars:', err);
      }
    }
  };

  const loadMoreNotifications = async () => {
    if (!userId || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const offset = nextPage * 10;
      
      // Load more read notifications
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('read', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + 9); // Load 10 more
      
      if (data && data.length > 0) {
        setNotifications(prev => [...prev, ...data]);
        setPage(nextPage);
        setHasMore(data.length === 10);
        
        // Fetch avatars for new notifications
        await fetchMissingAvatars(data);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationRead = (id: string, remove = false) => {
    setNotifications(prev => 
      remove ? prev.filter(n => n.id !== id) : prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = async () => {
    if (isMobile) {
      navigate('/notifications');
      setShowDropdown(false);
    } else {
      const newShowDropdown = !showDropdown;
      setShowDropdown(newShowDropdown);
      
      // If opening the dropdown and there are unread notifications, mark all as read
      if (newShowDropdown && unreadCount > 0) {
        await handleMarkAllAsRead();
      }
    }
  };

  if (!userId || loading) return (
    <div className="p-2 text-accent-text">
      <Bell className="h-5 w-5 opacity-50" />
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleNotificationClick}
        className="p-2 text-accent-text hover:bg-accent-base/20 rounded-full relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-accent-text hover:text-accent-text/80"
              >
                Mark all as read
              </button>
            )}
          </div>
          <NotificationsList 
            notifications={notifications}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMoreNotifications}
            onNotificationRead={(id) => {
              setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, read: true } : n)
              );
              setUnreadCount(prev => Math.max(0, prev - 1));
            }}
            onClose={() => {
              setShowDropdown(false);
            }}
            userAvatars={userAvatars}
          />
        </div>
      )}
    </div>
  );
}

export default NotificationBell