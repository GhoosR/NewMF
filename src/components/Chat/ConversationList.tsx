import React from 'react';
import { Plus, Search, X, Users } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { subscribeToConversationUpdates } from '../../lib/chat';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  otherUser?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  name?: string;
  image_url?: string;
  participants?: Array<{
    id: string;
    username: string;
    avatar_url?: string;
  }>;
  admin_id?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string | null;
  onSelect: (conversation: Conversation) => void;
  onConversationUpdate?: (conversations: Conversation[]) => void;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onConversationUpdate: (conversations: Conversation[]) => void;
  onCreateGroup?: () => void;
}

export function ConversationList({ 
  conversations, 
  activeConversationId, 
  onSelect, 
  onConversationUpdate,
  onCreateGroup 
}: ConversationListProps) {
  const navigate = useNavigate();
  const [showNewConversation, setShowNewConversation] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [localConversations, setLocalConversations] = React.useState<Conversation[]>(conversations);
  const [animatingConversations, setAnimatingConversations] = React.useState<Set<string>>(new Set());

  // Update local conversations when props change
  React.useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);

  // Subscribe to conversation updates for real-time sorting
  React.useEffect(() => {
    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await subscribeToConversationUpdates((updatedConversation: any) => {
          // Add animation class
          setAnimatingConversations(prev => new Set(prev).add(updatedConversation.id));

          // Move conversation to top with animation
          setTimeout(() => {
            setLocalConversations(prev => {
              const filtered = prev.filter(c => c.id !== updatedConversation.id);
              return [updatedConversation, ...filtered];
            });

            // Update parent component
            const newOrder = [updatedConversation, ...localConversations.filter(c => c.id !== updatedConversation.id)];
            onConversationUpdate?.(newOrder);

            // Remove animation class after animation completes
            setTimeout(() => {
              setAnimatingConversations(prev => {
                const newSet = new Set(prev);
                newSet.delete(updatedConversation.id);
                return newSet;
              });
            }, 300);
          }, 100);
        });
      } catch (error) {
        console.error('Error setting up conversation updates:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [localConversations, onConversationUpdate]);
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUser.id) // Exclude current user
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartConversation = async (user: any) => {
    setShowNewConversation(false);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Create or get direct chat using the stored procedure
      const { data: result, error: createError } = await supabase
        .rpc('create_or_get_direct_chat', {
          user1_id: currentUser.id,
          user2_id: user.id
        });

      if (createError) {
        console.error('Error creating/getting direct chat:', createError);
        return;
      }

      if (!result.success) {
        console.error('Error from stored procedure:', result.error);
        return;
      }

      const conversation = result.conversation;

      // Format conversation for onSelect
      onSelect({
        id: conversation.id,
        type: 'direct',
        otherUser: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url
        },
        lastMessage: conversation.last_message,
        lastMessageAt: conversation.last_message_at
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  // Filter conversations based on search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return localConversations;
    
    return localConversations.filter(conv => {
      if (conv.type === 'direct' && conv.otherUser) {
        return conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());
      } else if (conv.type === 'group' && conv.name) {
        return conv.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return false;
    });
  }, [localConversations, searchQuery]);

  // Search for new users to start conversation with
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-accent-text/10 bg-white">
          <h2 className="text-lg font-semibold text-content">Messages</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateGroup}
              className="p-2 text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
              title="Create group chat"
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
              title="New message"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-accent-text/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-base/20"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content/40" />
          </div>
        </div>

        <div className="divide-y divide-accent-text/10 overflow-y-auto flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 lg:p-8 text-center text-content/60">
              <div className="mb-4">
                <Plus className="h-12 w-12 text-content/20 mx-auto mb-2" />
                <p>No conversations yet</p>
              </div>
              <button
                onClick={() => setShowNewConversation(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Conversation
              </button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  onSelect(conversation);
                  // Move this conversation to top immediately for better UX
                  setLocalConversations(prev => {
                    const filtered = prev.filter(c => c.id !== conversation.id);
                    return [conversation, ...filtered];
                  });
                }}
                className={`w-full p-4 lg:p-6 flex items-start gap-4 hover:bg-accent-base/5 transition-all duration-300 ${
                  conversation.id === activeConversationId ? 'bg-accent-base/10' : ''
                } ${
                  animatingConversations.has(conversation.id) ? 'animate-pulse bg-accent-base/5' : ''
                }`}
              >
                {conversation.type === 'group' ? (
                  <Avatar
                    url={conversation.image_url}
                    size="md"
                    editable={false}
                  />
                ) : (
                  <Avatar
                    url={conversation.otherUser?.avatar_url}
                    size="md"
                    userId={conversation.otherUser?.id}
                    editable={false}
                  />
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-base lg:text-lg text-content truncate">
                      {conversation.type === 'group' ? conversation.name : conversation.otherUser?.username}
                    </span>
                    <div className="flex items-center gap-2">
                      {conversation.type === 'direct' && (
                        <div className={`w-2 h-2 rounded-full ${
                          conversation.otherUser?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      )}
                    {conversation.lastMessageAt && (
                      <span className="text-sm text-content/60 flex-shrink-0 ml-2">
                        {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    )}
                    </div>
                  </div>
                  {conversation.lastMessage && (
                    <p className="text-sm lg:text-base text-content/60 truncate leading-relaxed">
                      {conversation.lastMessage}
                    </p>
                  )}
                  {conversation.unreadCount ? (
                    <div className="flex justify-end mt-2">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-accent-text rounded-full">
                      {conversation.unreadCount}
                    </span>
                    </div>
                  ) : null}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
              <h3 className="text-lg font-semibold text-content">New Conversation</h3>
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-accent-text/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by username..."
                  className="w-full pl-10 pr-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 text-base"
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-text"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-8 text-center text-content/60">
                  {searchQuery.trim() ? 'No users found' : 'Start typing to search users'}
                </div>
              ) : (
                <div className="divide-y divide-accent-text/10">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-accent-base/5 transition-colors text-left"
                    >
                      <Avatar
                        url={user.avatar_url}
                        size="md"
                        userId={user.id}
                        editable={false}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-base text-content block truncate">
                          {user.username}
                        </span>
                        <span className="text-sm text-content/60">
                          Start conversation
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}