import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, Users } from 'lucide-react';
import { Panel as ResizablePanel, PanelGroup as ResizablePanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Avatar } from '../components/Profile/Avatar';
import { ChatCard, ChatInput } from '../components/ui/ChatCard';
import { ConversationList } from '../components/Chat/ConversationList';
import { Auth } from '../components/Auth';
import { CreateGroupChat } from '../components/Chat/CreateGroupChat';
import { EditGroupChat } from '../components/Chat/EditGroupChat';
import { GroupChatMembers } from '../components/Chat/GroupChatMembers';
import { 
  startConversation, 
  getConversationMessages, 
  sendMessage, 
  sendVoiceMessage,
  getConversations,
  subscribeToConversation,
  subscribeToConversationUpdates
} from '../lib/chat';
import { getUsersWithOnlineStatus } from '../lib/activity';
import { supabase } from '../lib/supabase';

export function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useState(() => new URLSearchParams(window.location.search));
  const groupId = searchParams.get('conversation');

  // Update search params when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
  }, [window.location.search]);
  const navigate = useNavigate();
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [conversationSubscription, setConversationSubscription] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showGroupMembers, setShowGroupMembers] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [switchingChat, setSwitchingChat] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('Cleaning up subscription');
        subscription.unsubscribe();
      }
      if (conversationSubscription) {
        console.log('Cleaning up conversation subscription');
        conversationSubscription.unsubscribe();
      }
    };
  }, [subscription, conversationSubscription]);

  // Set up conversation updates subscription
  useEffect(() => {
    const setupConversationUpdates = async () => {
      try {
        const sub = await subscribeToConversationUpdates((conversationId: string) => {
          // Update the conversation order when a conversation is updated
          setConversations(prev => {
            const conversation = prev.find(c => c.id === conversationId);
            if (!conversation) return prev;

            // Move updated conversation to top with smooth animation
            const filtered = prev.filter(c => c.id !== conversationId);
            return [conversation, ...filtered];
          });
        });
        setConversationSubscription(sub);
      } catch (error) {
        console.error('Error setting up conversation updates:', error);
      }
    };

    setupConversationUpdates();
  }, []);
  // Handle conversation selection
  const handleSelectConversation = async (conversation) => {
    // Clear current messages immediately to prevent showing old conversation
    setMessages([]);
    setConversationId(conversation.id);
    setSwitchingChat(true);
    setLoadingProgress(0);
    
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      if (conversation.type === 'direct') {
        setOtherUser(conversation.otherUser);
        navigate(`/chat/${conversation.otherUser.id}`);
      } else {
        // For group chats
        setOtherUser({
          id: conversation.id,
          username: conversation.name || 'Group Chat',
          avatar_url: conversation.image_url,
          isGroup: true,
          participants: conversation.participants,
          admin_id: conversation.admin_id
        });
        navigate(`/chat?conversation=${conversation.id}`);
      }

      // Load initial messages
      const initialMessages = await getConversationMessages(conversation.id, null, 30);
      setMessages(initialMessages);
      
      // Set up subscription
      if (subscription) {
        subscription.unsubscribe();
      }
      
      const sub = await subscribeToConversation(
        conversation.id,
        (newMessage) => {
          if (newMessage.sender.id !== currentUser?.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      );
      setSubscription(sub);
    } catch (error) {
      console.error('Error switching conversation:', error);
      setError('Failed to load conversation');
    } finally {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setSwitchingChat(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  // Handle conversation updates from child component
  const handleConversationUpdate = (updatedConversations: any[]) => {
    setConversations(updatedConversations);
  };
  useEffect(() => {
    // Get message from URL parameters
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setInitialMessage(message);
      // Remove the message parameter from URL
      params.delete('message');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('Initializing chat...');
        
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setIsAuthenticated(false);
          setLoading(false);
          if (userId) {
            setShowAuthModal(true);
          }
          return;
        }
        
        setIsAuthenticated(true);

        // Get current user and other user data with online status
        const usersToFetch = userId ? [user.id, userId] : [user.id];
        const usersWithStatus = await getUsersWithOnlineStatus(usersToFetch);
        const currentUserData = usersWithStatus[user.id];
        const otherUserData = userId ? usersWithStatus[userId] : null;

        if (!currentUserData) {
          setError('Failed to load user profile');
          setLoading(false);
          return;
        }

        setCurrentUser({
          id: user.id,
          username: currentUserData.username,
          avatar_url: currentUserData.avatar_url
        });

        // Load user conversations
        try {
          const userConversations = await getConversations();
          setConversations(userConversations);

          // Handle group chat after conversations are loaded
          if (groupId) {
            const conversation = userConversations.find(c => c.id === groupId);
            if (!conversation) {
              setError('Group chat not found');
              setLoading(false);
              return;
            }

            console.log('Found conversation:', conversation);
            console.log('Current user ID:', user.id);
            console.log('Conversation admin_id:', conversation.admin_id);

            setConversationId(groupId);
            setOtherUser({
              id: groupId,
              username: conversation.name || 'Group Chat',
              avatar_url: conversation.image_url,
              isGroup: true,
              participants: conversation.participants,
              admin_id: conversation.admin_id
            });

            // Load initial messages
            try {
              const initialMessages = await getConversationMessages(groupId, null, 30);
              setMessages(initialMessages);
            } catch (err) {
              console.error('Error fetching messages:', err);
              setError('Failed to load messages');
            }

            // Set up real-time subscription
            try {
              console.log('Setting up subscription for group chat:', groupId);
              const sub = await subscribeToConversation(
                groupId,
                (newMessage) => {
                  console.log('New message received:', newMessage);
                  // Only add messages from other users
                  if (newMessage.sender.id !== currentUser?.id) {
                    setMessages(prev => [...prev, newMessage]);
                  }
                }
              );
              setSubscription(sub);
            } catch (err) {
              console.error('Error setting up subscription:', err);
              setError('Failed to connect to real-time updates');
            }
          }
        } catch (err) {
          console.error('Error fetching conversations:', err);
          setError('Failed to load conversations');
        }

        if (userId) {
          if (!otherUserData) {
            setError('User not found');
            setLoading(false);
            return;
          }

          setOtherUser({
            id: userId,
            username: otherUserData.username,
            avatar_url: otherUserData.avatar_url,
            isOnline: otherUserData.isOnline
          });

          // Find or create conversation
          try {
            const conversation = await startConversation(userId);
            if (!conversation) {
              setError('Failed to start conversation');
              setLoading(false);
              return;
            }

            setConversationId(conversation.id);

            // Load initial messages
            try {
              const initialMessages = await getConversationMessages(conversation.id, null, 30);
              setMessages(initialMessages);
            } catch (err: any) {
              console.error('Error fetching messages:', err);
              setError(err.message || 'Failed to load messages');
              setLoading(false);
              return;
            }

            // Update last viewed timestamp
            try {
              const { error: updateError } = await supabase
                .from('conversations')
                .update({
                  last_viewed_by: user.id,
                  last_viewed_at: new Date().toISOString()
                })
                .eq('id', conversation.id);

              if (updateError) {
                console.error('Error updating last viewed:', updateError);
              }
            } catch (err) {
              console.error('Error updating last viewed:', err);
              // Don't fail the whole operation for this error
            }

            // Set up real-time subscription
            try {
              console.log('Setting up subscription for conversation:', conversation.id);
              const sub = await subscribeToConversation(
                conversation.id,
                (newMessage) => {
                  console.log('New message received:', newMessage);
                  // Only add messages from other users
                  if (newMessage.sender.id !== currentUser?.id) {
                    setMessages(prev => [...prev, newMessage]);
                  }
                }
              );
              setSubscription(sub);
            } catch (err: any) {
              console.error('Error setting up subscription:', err);
              setError(err.message || 'Failed to connect to real-time updates');
              setLoading(false);
              return;
            }
          } catch (err: any) {
            console.error('Error starting conversation:', err);
            setError(err.message || 'Failed to start conversation');
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.error('Error initializing chat:', err);
        setError('Failed to initialize chat');
      } finally {
        setLoading(false);
        setLoadingConversation(false);
      }
    };

    initializeChat();
  }, [userId, groupId]);

  // Reset loading state when component mounts or userId changes
  useEffect(() => {
    if (userId || groupId) {
      setLoadingConversation(true);
      // Reset after a short delay to allow for smooth transitions
      const timer = setTimeout(() => setLoadingConversation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  // Update last viewed timestamp periodically while chat is open
  useEffect(() => {
    if (!conversationId) return;

    const updateLastViewed = async () => {
      if (!currentUser?.id || !conversationId) return;
      
      try {
        // Update directly in the conversations table
        const { error } = await supabase
          .from('conversations')
          .update({
            last_viewed_by: currentUser.id,
            last_viewed_at: new Date().toISOString()
          })
          .eq('id', conversationId)
          .filter('participant_ids', 'cs', `{${currentUser.id}}`);

        if (error) {
          console.error('Error updating last viewed:', error);
        }
      } catch (err) {
        console.error('Error updating last viewed:', err);
      }
    };

    // Update immediately and then every 30 seconds
    updateLastViewed();
    const interval = setInterval(updateLastViewed, 30000);

    return () => clearInterval(interval);
  }, [conversationId, currentUser?.id]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return;
    const tempId = crypto.randomUUID();
    try {
      // Add message locally first for better UX
      const localMessage = {
        id: tempId,
        content,
        created_at: new Date().toISOString(),
        sender: {
          id: currentUser?.id || '',
          username: currentUser?.username || 'You',
          avatar_url: currentUser?.avatar_url,
          isOnline: true,
          isCurrentUser: true
        },
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, localMessage]);

      // Send message to server
      await sendMessage(conversationId, content);

      // Move current conversation to top of list immediately
      setConversations(prev => {
        const currentConv = prev.find(c => c.id === conversationId);
        if (!currentConv) return prev;
        
        const filtered = prev.filter(c => c.id !== conversationId);
        return [{
          ...currentConv,
          lastMessage: content,
          lastMessageAt: new Date().toISOString()
        }, ...filtered];
      });
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw new Error('Failed to send message. Please try again.');
    }
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!conversationId) return;
    const tempId = crypto.randomUUID();
    try {
      // Add voice message locally first for better UX
      const localMessage = {
        id: tempId,
        content: '🎤 Voice message',
        messageType: 'voice',
        audioUrl: URL.createObjectURL(audioBlob),
        audioDuration: duration,
        created_at: new Date().toISOString(),
        sender: {
          id: currentUser?.id || '',
          username: currentUser?.username || 'You',
          avatar_url: currentUser?.avatar_url,
          isOnline: true,
          isCurrentUser: true
        },
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        status: 'sent'
      };
      
      setMessages(prev => [...prev, localMessage]);

      // Send voice message to server
      await sendVoiceMessage(conversationId, audioBlob, duration);

      // Move current conversation to top of list immediately
      setConversations(prev => {
        const currentConv = prev.find(c => c.id === conversationId);
        if (!currentConv) return prev;
        
        const filtered = prev.filter(c => c.id !== conversationId);
        return [{
          ...currentConv,
          lastMessage: '🎤 Voice message',
          lastMessageAt: new Date().toISOString()
        }, ...filtered];
      });
    } catch (err) {
      console.error('Error sending voice message:', err);
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      throw new Error('Failed to send voice message. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
        {showAuthModal && (
          <Auth onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">{error}</h2>
          <Link to="/" className="text-accent-text hover:text-accent-text/80">
            Return to Home
          </Link>
          {showAuthModal && (
            <Auth onClose={() => setShowAuthModal(false)} />
          )}
        </div>
      </div>
    );
  }

  if (isAuthenticated === false && userId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#F3F7EE] to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <MessageSquare className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Sign in to Message
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Please sign in to start a conversation with this user.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
            >
              Sign in to Continue
            </button>
          </div>
        </div>

        {showAuthModal && (
          <Auth onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <>
    <div className="h-full flex flex-col">
      <div className="flex-1 h-screen overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className={`${userId || groupId ? 'hidden lg:block' : 'w-full lg:w-auto'}`}
          >
            <div className="h-full bg-gray-50 border-r border-accent-text/10">
              <ConversationList 
                conversations={conversations}
                activeConversationId={conversationId}
                onSelect={handleSelectConversation}
                onConversationUpdate={handleConversationUpdate}
                onCreateGroup={() => setShowCreateGroup(true)}
              />
            </div>
          </ResizablePanel>

          <PanelResizeHandle className="hidden lg:block w-1 hover:w-2 bg-accent-text/5 hover:bg-accent-text/10 transition-all" />

          <ResizablePanel defaultSize={80} className={`bg-white relative overflow-hidden ${!userId && !groupId ? 'hidden lg:flex' : 'w-full lg:w-auto'}`}>
           {(loadingConversation || switchingChat) && (
             <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
               <div className="flex flex-col items-center space-y-4">
                 {/* Beautiful loading animation */}
                 <div className="relative">
                   <div className="w-16 h-16 border-4 border-accent-text/20 rounded-full"></div>
                   <div className="absolute top-0 left-0 w-16 h-16 border-4 border-accent-text border-t-transparent rounded-full animate-spin"></div>
                   <div className="absolute top-2 left-2 w-12 h-12 border-4 border-accent-text/40 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                   <div className="absolute top-4 left-4 w-8 h-8 bg-accent-text/10 rounded-full flex items-center justify-center">
                     <MessageSquare className="h-4 w-4 text-accent-text animate-pulse" />
                   </div>
                 </div>
                 
                 {/* Loading text with typing animation */}
                 <div className="text-center">
                   <p className="text-lg font-medium text-content mb-2">
                     {switchingChat ? 'Switching conversation' : 'Loading chat'}
                     <span className="animate-pulse">...</span>
                   </p>
                   <p className="text-sm text-content/60">
                     {switchingChat ? 'Preparing your conversation' : 'Setting up secure messaging'}
                   </p>
                 </div>
                 
                 {/* Progress bar for chat switching */}
                 {switchingChat && (
                   <div className="w-48 bg-accent-text/20 rounded-full h-2 overflow-hidden">
                     <div 
                       className="h-full bg-accent-text rounded-full transition-all duration-300 ease-out"
                       style={{ width: `${loadingProgress}%` }}
                     ></div>
                   </div>
                 )}
               </div>
             </div>
           )}
           {(userId || groupId) ? (
             otherUser && currentUser && (
             <div className="flex flex-col h-full lg:h-auto relative">
               {/* Chat Header */}
               <div className="flex items-center justify-between p-4 lg:p-6 border-b border-accent-text/10">
                 <div className="flex items-center gap-3">
                   <Link
                     to="/chat"
                     className="lg:hidden p-2 -ml-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
                   >
                     <ArrowLeft className="h-6 w-6" />
                   </Link>
                {otherUser.isGroup ? (
                  <div className="flex items-center gap-3">
                    <Avatar
                      url={otherUser.avatar_url}
                      size="sm"
                      userId={otherUser.id}
                      editable={false}
                    />
                    <div>
                      <button 
                        onClick={() => setShowEditGroup(true)}
                        className="font-semibold text-lg text-content hover:text-accent-text transition-colors text-left"
                      >
                        {otherUser.username}
                      </button>
                      <button 
                        onClick={() => setShowGroupMembers(true)}
                        className="text-sm text-content/60 hover:text-accent-text transition-colors flex items-center gap-1"
                      >
                        <Users size={14} />
                        {otherUser.participants ? `${otherUser.participants.length} members` : 'Loading members...'}
                      </button>
                    </div>
                  </div>
                   ) : (
                     <Link to={`/profile/${otherUser.username}/listings`} className="flex items-center gap-3">
                       <Avatar
                         url={otherUser.avatar_url}
                         size="sm"
                         userId={otherUser.id}
                         editable={false}
                       />
                       <div>
                         <span className="font-semibold text-lg text-content">{otherUser.username}</span>
                         <div className="text-sm text-content/60">
                           {otherUser.isOnline ? 'Online' : 'Offline'}
                         </div>
                       </div>
                     </Link>
                   )}
                 </div>
               </div>
               
               <div className="flex-1 h-full lg:h-auto">
                 <ChatCard
                   chatName={otherUser.username}
                  initialMessages={messages}
                  currentUser={currentUser}
                  className="w-full h-full lg:min-h-[500px]"
                  initialMessage={initialMessage}
                  onSendMessage={handleSendMessage}
                  onSendVoiceMessage={handleSendVoiceMessage}
                   onLoadMore={async (oldestMessageCreatedAt) => {
                     if (!conversationId) return [];
                     return getConversationMessages(conversationId, oldestMessageCreatedAt, 30);
                   }}
                 />
               </div>
             </div>
             )
           ) : (
             <div className="bg-white rounded-lg shadow-sm p-8 text-center lg:min-h-[500px] flex flex-col justify-center">
               <MessageSquare className="h-12 w-12 text-accent-text/20 mx-auto mb-4" />
               <h2 className="text-xl font-medium text-content mb-2">Select a conversation</h2>
               <p className="text-content/60">
                 Choose a conversation from the list to start chatting
               </p>
             </div>
           )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
      
    {showAuthModal && (
      <Auth onClose={() => setShowAuthModal(false)} />
    )}

      {showCreateGroup && (
        <CreateGroupChat
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(conversationId) => {
            setShowCreateGroup(false);
            navigate(`/chat?conversation=${conversationId}`);
          }}
        />
      )}

      {showEditGroup && otherUser?.isGroup && (
        <EditGroupChat
          conversationId={conversationId!}
          currentName={otherUser.username}
          currentImage={otherUser.avatar_url}
          onClose={() => setShowEditGroup(false)}
          onSuccess={(newName, newImage) => {
            setOtherUser(prev => ({
              ...prev!,
              username: newName,
              avatar_url: newImage
            }));
            setShowEditGroup(false);
          }}
        />
      )}

      {showGroupMembers && otherUser?.isGroup && conversationId && (() => {
        console.log('Current user:', currentUser);
        console.log('Other user:', otherUser);
        console.log('Current user ID:', currentUser?.id);
        console.log('Admin ID:', otherUser.admin_id);
        console.log('Is Admin?', currentUser?.id === otherUser.admin_id);
        
        return (
          <GroupChatMembers
            conversationId={conversationId}
            onClose={() => setShowGroupMembers(false)}
            isAdmin={currentUser?.id === otherUser.admin_id}
          />
        );
      })()}
    </>
  );
}

export default Chat;