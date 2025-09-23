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
 */
async function createMessageNotification(
  recipientId: string,
  senderId: string,
  conversationId: string,
  messagePreview: string
) {
  try {
    console.log('Creating notification for conversation:', conversationId);

    // Get conversation details first
    const { data: conversationDetails, error: convDetailsError } = await supabase
      .from('conversations')
      .select('name, type, participant_ids')
      .eq('id', conversationId)
      .single();

    console.log('[DEBUG] Creating notification:', {
      conversationId,
      conversationDetails,
      error: convDetailsError,
      senderProfile
    });

    if (!conversationDetails) {
      throw new Error('Conversation not found');
    }

    console.log('Is group chat?', conversationDetails.type === 'group');

    // Check if there's already a notification for this conversation (read or unread)
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('id, read')
      .eq('user_id', recipientId)
      .eq('type', conversationDetails.type === 'group' ? 'new_group_message' : 'new_message')
      .filter('data->>conversation_id', 'eq', conversationId)
      .order('created_at', { ascending: false });

    // Get the most recent notification for this conversation
    const existingNotification = existingNotifications?.[0];

    // Create different messages for group vs direct chats
    const notificationMessage = conversationDetails.type === 'group'
      ? `New message in ${conversationDetails.name}`
      : `New message`;

    const notificationData = {
      message: notificationMessage,
      data: {
        conversation_id: conversationId,
        conversation_type: conversationDetails.type,
        conversation_name: conversationDetails.name,
        message_preview: messagePreview.substring(0, 100)
      }
    };

    if (existingNotification) {
      // Update existing notification with latest message and bring to top
      const notificationToUpdate = {
        title: conversationDetails.type === 'group' ? `New message in ${conversationDetails.name}` : 'New message',
        type: conversationDetails.type === 'group' ? 'new_group_message' : 'new_message',
        message: notificationData.message,
        data: {
          ...notificationData.data,
          conversation_type: conversationDetails.type,
          conversation_name: conversationDetails.name
        },
        read: false, // Keep as unread
        created_at: new Date().toISOString() // Update timestamp to bring to top
      };

      console.log('Updating notification:', notificationToUpdate);

      const { error } = await supabase
        .from('notifications')
        .update(notificationToUpdate)
        .eq('id', existingNotification.id);

      if (error) throw error;
    } else {
      // Create new notification
      const notificationToCreate = {
        user_id: recipientId,
        type: conversationDetails.type === 'group' ? 'new_group_message' : 'new_message',
        title: conversationDetails.type === 'group' ? `New message in ${conversationDetails.name}` : 'New message',
        message: notificationData.message,
        data: {
          ...notificationData.data,
          conversation_type: conversationDetails.type,
          conversation_name: conversationDetails.name
        }
      };

      console.log('[DEBUG] Notification data:', {
        notificationToCreate,
        isGroup: conversationDetails.type === 'group',
        conversationType: conversationDetails.type,
        groupName: conversationDetails.name
      });

      console.log('Creating notification:', notificationToCreate);

      const { error } = await supabase
        .from('notifications')
        .insert([notificationToCreate]);

      if (error) throw error;
    }

    // Send push notification via OneSignal Edge Function
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-onesignal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          user_id: recipientId,
          title: conversationDetails.type === 'group' ? `New message in ${conversationDetails.name}` : 'New message',
          message: notificationData.message,
          data: {
            ...notificationData.data,
            conversation_type: conversationDetails.type,
            conversation_name: conversationDetails.name
          }
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
    console.error('Error creating message notification:', error);
    throw error;
  }
}

export { 
  createNotification, 
  createMessageNotification
};