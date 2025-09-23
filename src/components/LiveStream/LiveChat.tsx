import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, AlertTriangle, MessageSquareOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { AdminChatControls } from './AdminChatControls';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

interface LiveChatProps {
  onSignInClick: () => void;
  isAdmin?: boolean;
}

export function LiveChat({ onSignInClick, isAdmin = false }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const lastUserScrollTime = useRef(Date.now());
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        checkMutedStatus(session.user.id);
      }
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        checkMutedStatus(session.user.id);
      } else {
        setIsMuted(false);
      }
    });

    // Check chat settings
    checkChatSettings();

    // Fetch initial messages
    fetchMessages();

    // Listen for chat cleared event
    const handleChatCleared = () => {
      setMessages([]);
      fetchMessages(); // Refetch to ensure we have the latest state
    };

    window.addEventListener('chat-cleared', handleChatCleared);

    // Subscribe to new messages
    const channel = supabase
      .channel('live_chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages'
        },
        async (payload) => {
          // Fetch user details for the new message
          const { data: user } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            ...payload.new,
            user
          };

          setMessages(prev => [...prev, newMessage]);
          if (shouldAutoScroll) {
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_chat_messages'
        },
        () => {
          // When messages are deleted, clear the local state and refetch
          setMessages([]);
          fetchMessages();
        }
      )
      .subscribe();

    // Subscribe to chat settings changes
    const settingsChannel = supabase
      .channel('live_stream_settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_stream_settings'
        },
        (payload) => {
          if (payload.new?.chat_enabled !== undefined) {
            setChatEnabled(payload.new.chat_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      authSubscription.unsubscribe();
      channel.unsubscribe();
      settingsChannel.unsubscribe();
      window.removeEventListener('chat-cleared', handleChatCleared);
    };
  }, []);

  const checkMutedStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('muted_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsMuted(!!data);
    } catch (err) {
      console.error('Error checking muted status:', err);
    }
  };

  const checkChatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('live_stream_settings')
        .select('chat_enabled')
        .limit(1)
        .single();

      if (error) throw error;
      setChatEnabled(data?.chat_enabled ?? true);
    } catch (err) {
      console.error('Error checking chat settings:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('live_chat_messages')
        .select(`
          id,
          content,
          created_at,
          user:users (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100);

      if (fetchError) throw fetchError;
      setMessages(data || []);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load chat messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const newIsNearBottom = distanceFromBottom < 100;

      // Update near bottom state
      setIsNearBottom(newIsNearBottom);

      // If user manually scrolled (not due to new messages)
      if (Date.now() - lastUserScrollTime.current > 100) {
        setShouldAutoScroll(newIsNearBottom);
      }

      lastUserScrollTime.current = Date.now();
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change if auto-scroll is enabled
    if (shouldAutoScroll && messagesEndRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !isAuthenticated || !chatEnabled || isMuted) return;

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .insert([{
          content: newMessage.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px] bg-white rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  return (
    <div className="bg-accent-base rounded-lg shadow-sm overflow-hidden">
      {isAdmin && (
        <AdminChatControls isAdmin={isAdmin} />
      )}
      
      <div className="p-4 border-b border-accent-text/10 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-content">Live Chat</h2>
          {!chatEnabled && (
            <div className="flex items-center text-red-600">
              <MessageSquareOff className="h-4 w-4 mr-1" />
              <span className="text-xs">Chat Disabled</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div 
        ref={chatContainerRef}
        className="h-[400px] overflow-y-auto p-4 space-y-4 bg-white"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <Link to={`/profile/${message.user.username}/listings`}>
              <Avatar
                url={message.user.avatar_url}
                size="sm"
                userId={message.user.id}
                editable={false}
              />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <Username
                  username={message.user.username}
                  userId={message.user.id}
                  className="font-medium text-content"
                />
                <span className="text-xs text-content/60">
                  {new Date(message.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-content/80 break-words">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {!chatEnabled ? (
        <div className="p-4 border-t border-gray-100 bg-red-50">
          <div className="flex items-center justify-center text-red-600">
            <MessageSquareOff className="h-5 w-5 mr-2" />
            <span className="text-sm">Chat is currently disabled</span>
          </div>
        </div>
      ) : isMuted ? (
        <div className="p-4 border-t border-gray-100 bg-red-50">
          <div className="flex items-center justify-center text-red-600">
            <UserX className="h-5 w-5 mr-2" />
            <span className="text-sm">You have been muted from chat</span>
          </div>
        </div>
      ) : isAuthenticated ? (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!chatEnabled || isMuted}
              maxLength={500}
              className="flex-1 px-4 py-2 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-text/20 focus:border-accent-text"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !chatEnabled || isMuted}
              className="px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-100 bg-accent-base/5">
          <button
            onClick={onSignInClick}
            className="w-full px-4 py-2 text-accent-text border border-accent-text rounded-lg hover:bg-accent-text hover:text-white transition-colors"
          >
            Sign in to chat
          </button>
        </div>
      )}
    </div>
  );
}