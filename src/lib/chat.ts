import { supabase } from './supabase';

export async function getConversations() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // First get all conversations the user is part of
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [user.id])
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Then get all participants for these conversations
    const { data: participants, error: participantsError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', conversations.flatMap(c => c.participant_ids));

    if (participantsError) throw participantsError;

    if (error) throw error;

    return conversations.map(conversation => {
      const conversationParticipants = participants.filter(p => 
        conversation.participant_ids.includes(p.id)
      );
      
      if (conversation.type === 'group') {
        return {
          id: conversation.id,
          type: 'group',
          name: conversation.name,
          image_url: conversation.image_url,
          participant_ids: conversation.participant_ids,
          participants: conversationParticipants,
          admin_id: conversation.admin_id,
          lastMessage: conversation.last_message,
          lastMessageAt: conversation.last_message_at,
          unreadCount: 0 // TODO: Implement unread count for groups
        };
      } else {
        // For direct chats, find the other user
        const otherUser = conversationParticipants.find(u => u.id !== user.id);
        return {
          id: conversation.id,
          type: 'direct',
          otherUser: otherUser ? {
            id: otherUser.id,
            username: otherUser.username,
            avatar_url: otherUser.avatar_url
          } : null,
          lastMessage: conversation.last_message,
          lastMessageAt: conversation.last_message_at,
          unreadCount: 0 // TODO: Implement unread count
        };
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

export async function startConversation(userId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get other user's data to verify they exist
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !otherUser) {
      console.error('Error fetching other user:', userError);
      throw new Error('User not found');
    }

    // Create or get direct chat using the stored procedure
    const { data: result, error: createError } = await supabase
      .rpc('create_or_get_direct_chat', {
        user1_id: user.id,
        user2_id: userId
      });

    if (createError) {
      console.error('Error creating/getting direct chat:', createError);
      throw new Error('Failed to handle direct chat');
    }

    if (!result.success) {
      console.error('Error from stored procedure:', result.error);
      throw new Error(`Failed to handle direct chat: ${result.error}`);
    }

    return result.conversation;
  } catch (err: any) {
    console.error('Error starting conversation:', {
      error: err,
      errorCode: err.code,
      errorMessage: err.message,
      errorDetails: err.details,
      userId,
      timestamp: new Date().toISOString()
    });
    // Provide more specific error messages based on the error code
    if (err.code === '23505') { // Unique violation
      throw new Error('Conversation already exists - please try refreshing the page');
    } else if (err.code === '23503') { // Foreign key violation
      throw new Error('One or more participants no longer exist');
    } else if (err.code === '42P01') { // Undefined table
      throw new Error('Database configuration error - please contact support');
    }
    throw new Error(`Failed to handle conversation: ${err.message}`);
  }
}

export async function getConversationMessages(conversationId: string, beforeTimestamp: string | null = null, limit: number = 30) {
  try {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:users (
          id,
          username,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt('created_at', beforeTimestamp);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    return messages.map(message => ({
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        avatar_url: message.sender.avatar_url,
        isOnline: true, // TODO: Implement online status
        isCurrentUser: message.sender.id === user.id
      },
      timestamp: new Date(message.created_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      status: 'sent'
    })).reverse();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendMessage(conversationId: string, content: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get conversation type first
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('type, participant_ids')
      .eq('id', conversationId)
      .single();

    if (convError) throw convError;

    // If it's a group chat, check if we should prevent direct chat creation
    if (conversation.type === 'group') {
      for (const participantId of conversation.participant_ids) {
        if (participantId === user.id) continue;

        const { data: shouldCreate, error: checkError } = await supabase
          .rpc('should_create_direct_chat', {
            user_id_1: user.id,
            user_id_2: participantId
          });

        if (checkError) {
          console.error('Error checking direct chat status:', checkError);
          continue;
        }

        if (shouldCreate) {
          throw new Error('Direct chat creation between group members is not allowed');
        }
      }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content
      })
      .select(`
        *,
        sender:users (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) throw error;

    // Update conversation's last message and last viewed
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        last_viewed_by: user.id,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (updateError) throw updateError;

    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function subscribeToConversation(conversationId: string, onMessage: (message: any) => void) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      async (payload) => {
        // Fetch full message data including sender
        const { data: message } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users (
              id,
              username,
              avatar_url
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (message) {
          const { data: { user } } = await supabase.auth.getUser();
          onMessage({
            id: message.id,
            content: message.content,
            sender: {
              id: message.sender.id,
              username: message.sender.username,
              avatar_url: message.sender.avatar_url,
              isOnline: true,
              isCurrentUser: user?.id === message.sender.id
            },
            timestamp: new Date(message.created_at).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            status: 'sent'
          });
        }
      }
    )
    .subscribe();
}

export async function getConversationById(conversationId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get conversation data
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    if (!conversation) throw new Error('Conversation not found');

    // Get participants data
    const { data: participants, error: participantsError } = await supabase
      .from('users')
      .select('id, username, avatar_url')
      .in('id', conversation.participant_ids);

    if (participantsError) throw participantsError;

    // Format conversation data
    if (conversation.type === 'group') {
      return {
        id: conversation.id,
        type: 'group',
        name: conversation.name,
        image_url: conversation.image_url,
        participant_ids: conversation.participant_ids,
        participants: participants,
        admin_id: conversation.admin_id,
        lastMessage: conversation.last_message,
        lastMessageAt: conversation.last_message_at,
        unreadCount: 0 // TODO: Implement unread count for groups
      };
    } else {
      // For direct chats, find the other user
      const otherUser = participants.find(p => p.id !== user.id);
      return {
        id: conversation.id,
        type: 'direct',
        otherUser: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          avatar_url: otherUser.avatar_url
        } : null,
        lastMessage: conversation.last_message,
        lastMessageAt: conversation.last_message_at,
        unreadCount: 0 // TODO: Implement unread count
      };
    }
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export async function subscribeToConversationUpdates(onUpdate: (conversationId: string) => void) {
  return supabase
    .channel('conversation_updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations'
      },
      async (payload) => {
        if (payload.new && payload.new.id) {
          try {
            // Fetch updated conversation data
            const updatedConversation = await getConversationById(payload.new.id);
            onUpdate(updatedConversation);
          } catch (error) {
            console.error('Error fetching updated conversation:', error);
          }
        }
      }
    )
    .subscribe();
}