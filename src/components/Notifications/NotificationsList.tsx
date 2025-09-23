import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { NotificationActions } from './NotificationActions';
import { supabase } from '../../lib/supabase';
import type { Notification } from '../../types/notifications';

interface NotificationsListProps {
  notifications: Notification[];
  onNotificationRead: (id: string, remove?: boolean) => void;
  onClose?: () => void;
  userAvatars?: Record<string, string>;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

export function NotificationsList({ 
  notifications, 
  onNotificationRead, 
  onClose, 
  userAvatars = {},
  hasMore = false,
  loadingMore = false,
  onLoadMore
}: NotificationsListProps) {
  const navigate = useNavigate();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    if (isNearBottom && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        await handleRead(notification.id);
      }
      
      // Handle navigation based on notification type
      switch (notification.type) {
        case 'new_message':
        case 'new_group_message': {
          const conversationId = notification.data.conversation_id;
          if (conversationId) {
            // Always navigate using conversation ID for both private and group messages
            navigate(`/chat?conversation=${conversationId}`);
          }
          break;
        }
        case 'practitioner_approved':
          if (notification.data.listing_slug) {
            navigate(`/practitioners/${notification.data.listing_slug}`);
          }
          break;
        case 'event_approved':
          if (notification.data.listing_slug) {
            navigate(`/events/${notification.data.listing_slug}`);
          }
          break;
        case 'venue_approved':
          if (notification.data.listing_slug) {
            navigate(`/venues/${notification.data.listing_slug}`);
          }
          break;
        case 'job_approved':
          if (notification.data.listing_slug) {
            navigate(`/jobs/${notification.data.listing_slug}`);
          }
          break;
        case 'course_approved':
          if (notification.data.listing_id) {
            navigate(`/courses/${notification.data.listing_id}`);
          }
          break;
        case 'recipe_approved':
          if (notification.data.listing_id) {
            navigate(`/recipes/${notification.data.listing_id}`);
          }
          break;
        case 'join_request':
        case 'join_request_approved':
        case 'join_request_rejected':
          navigate(`/communities/${notification.data.community_id}`);
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

      onClose?.();
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
      onNotificationRead(id, remove);
    }
  };

  return (
    <div 
      ref={scrollRef}
      className="max-h-96 overflow-y-auto"
      onScroll={handleScroll}
    >
      {notifications.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No notifications
        </div>
      ) : (
        <>
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transform transition-all duration-200 ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
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
                      <span className="font-medium text-gray-900">
                        {notification.data?.conversation_type === 'group'
                          ? `New message in ${notification.data.conversation_name}`
                          : 'New message'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {(() => {
                        console.log('[DEBUG] Rendering notification:', {
                          id: notification.id,
                          type: notification.type,
                          data: notification.data,
                          isGroup: notification.data?.conversation_type === 'group',
                          conversationType: notification.data?.conversation_type,
                          groupName: notification.data?.conversation_name,
                          senderUsername: notification.data?.sender_username
                        });
                        return notification.data?.conversation_type === 'group' 
                          ? `New message in ${notification.data.conversation_name}`
                          : 'New message';
                      })()}
                    </p>
                    <NotificationActions 
                      notification={notification}
                      onAction={(id) => handleRead(id, true)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {loadingMore && (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-text"></div>
            </div>
          )}
          
          {!hasMore && notifications.length > 10 && (
            <div className="p-4 text-center text-gray-500 text-sm">
              No more notifications
            </div>
          )}
        </>
      )}
    </div>
  );
}