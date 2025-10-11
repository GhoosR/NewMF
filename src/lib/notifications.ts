// notifications.ts
import { supabase } from './supabase';
import type { Notification } from '../types/notifications';

interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, any>;
}

/**
 * Create a new notification in database
 */
async function createNotification(notification: NotificationData) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      }]);

    if (error) throw error;

    // Send push notification via OneSignal Edge Function
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-onesignal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          data: notification.data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send push notification:', error);
      }
    } catch (err) {
      console.error('Error sending push notification:', err);
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create a notification for new messages
 * NOTE: This function is disabled - notifications are now handled by database trigger
 */
async function createMessageNotification(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messagePreview: string
) {
  // This function is disabled to prevent duplicate notifications
  // Notifications are now handled by the database trigger: create_message_notification_trigger
  console.log('createMessageNotification called but disabled - notifications handled by database trigger');
  return;
}

export { 
  createNotification, 
  createMessageNotification
};