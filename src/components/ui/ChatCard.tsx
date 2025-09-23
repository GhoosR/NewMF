import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../Profile/Avatar';

export interface Message {
  id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    username: string;
    avatar_url?: string;
    isOnline: boolean;
    isCurrentUser?: boolean;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface ChatCardProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => void;
  onLoadMore?: (oldestMessageCreatedAt: string | null) => Promise<Message[]>;
  className?: string;
  initialMessage?: string | null;
}

export function ChatCard({
  initialMessages = [],
  onSendMessage,
  onLoadMore,
  className,
  initialMessage,
}: ChatCardProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState(initialMessage || '');
  const [hasMore, setHasMore] = useState(initialMessages.length >= 30);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setIsNearBottom] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Add useEffect to listen for initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
    setHasMore(initialMessages.length >= 30);
    setShouldScrollToBottom(true);
  }, [initialMessages]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (container && shouldScrollToBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  };

  // Check if user is near bottom when scrolling
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrollPosition = scrollHeight - scrollTop - clientHeight;
      const isNearBottomNow = scrollPosition < 100;
      
      setIsNearBottom(isNearBottomNow);
      setShouldScrollToBottom(isNearBottomNow);
      
      // Check if we should load more messages
      if (scrollTop === 0 && hasMore && !loadingMore) {
        // Store current scroll position
        const currentScroll = container.scrollHeight - container.scrollTop;
        handleLoadMore().then(() => {
          // Restore scroll position after loading
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight - currentScroll;
          });
        });
      }
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore || !onLoadMore || messages.length === 0) return;
    
    try {
      setLoadingMore(true);
      
      // Get the oldest message's created_at timestamp
      const oldestMessage = messages[0];
      const oldestMessageCreatedAt = oldestMessage?.created_at || null;
      
      const olderMessages = await onLoadMore(oldestMessageCreatedAt);
      
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setHasMore(olderMessages.length >= 30);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Initial load scroll and messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewMessage = lastMessage && Date.now() - new Date(lastMessage.created_at).getTime() < 1000;
      
      if (isNewMessage || initialMessages === messages) {
        scrollToBottom('auto');
        setShouldScrollToBottom(true);
      }
    }
  }, [messages, initialMessages]);

  // Auto scroll on initial load
  useEffect(() => {
    scrollToBottom('auto');
    setShouldScrollToBottom(true);
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      let scrollTimeout: NodeJS.Timeout;
      
      const handleScrollThrottled = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (!loadingMore) {
            handleScroll();
          }
        }, 100);
      };
      
      container.addEventListener('scroll', handleScrollThrottled);
      return () => {
        container.removeEventListener('scroll', handleScrollThrottled);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }
  }, [loadingMore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await onSendMessage?.(inputValue);
      setInputValue('');
      
      // Reset input and refocus
      if (inputRef.current) {
        inputRef.current.focus();
      }
      setShouldScrollToBottom(true);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Group messages by sender and time
  const groupedMessages = messages.reduce((groups: Message[][], message, index) => {
    const prevMessage = messages[index - 1];
    
    // Start a new group if:
    // 1. This is the first message
    // 2. The sender changed
    // 3. More than 5 minutes passed since the last message
    const shouldStartNewGroup = 
      !prevMessage || 
      prevMessage.sender.id !== message.sender.id ||
      (new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 5 * 60 * 1000);
    
    if (shouldStartNewGroup) {
      groups.push([message]);
    } else {
      groups[groups.length - 1].push(message);
    }
    
    return groups;
  }, []);

  return (
    <div className={`flex flex-col h-full relative ${className}`}>
      {/* Messages container */}
      <div className="absolute inset-0 bottom-[80px] bg-gray-50">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-4 py-6 lg:px-6 space-y-4"
          onScroll={handleScroll}
        >
          {loadingMore && (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-text"></div>
            </div>
          )}
          
          {hasMore && !loadingMore && (
            <button
              onClick={handleLoadMore}
              className="w-full text-sm text-accent-text hover:text-accent-text/80 py-2"
            >
              Load older messages
            </button>
          )}

          {groupedMessages.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="space-y-1">
              {group.map((message, messageIndex) => {
                const isFirstInGroup = messageIndex === 0;
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex ${message.sender.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex ${message.sender.isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                      {/* Avatar - only show for first message in group */}
                      {isFirstInGroup && !message.sender.isCurrentUser && (
                        <div className="flex-shrink-0 mr-2">
                          <Link to={`/profile/${message.sender.username}/listings`}>
                            <Avatar
                              url={message.sender.avatar_url}
                              size="sm"
                              userId={message.sender.id}
                              editable={false}
                            />
                          </Link>
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${message.sender.isCurrentUser ? 'items-end' : 'items-start'}`}>
                        {/* Username and timestamp - only for first message in group */}
                        {isFirstInGroup && (
                          <div className={`flex items-center mb-1 ${message.sender.isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-xs text-gray-500 mx-2">
                              {message.timestamp}
                            </span>
                            {!message.sender.isCurrentUser && (
                              <span className="font-medium text-sm text-gray-700">
                                {message.sender.username}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div 
                          className={`px-4 py-2 rounded-xl break-words ${
                            message.sender.isCurrentUser 
                              ? 'bg-accent-text text-white' 
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat Input */}
      <ChatInput onSendMessage={() => handleSubmit({ preventDefault: () => {}, type: 'submit' } as React.FormEvent)} />
    </div>
  );
}

// Separate ChatInput component
interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const messageContent = inputValue.trim();
    setLoading(true);
    
    // Focus input immediately for better UX
    if (inputRef.current) {
      inputRef.current.focus();
    }

    try {
      await onSendMessage(messageContent);
      setInputValue('');
    } catch (err) {
      console.error('Error sending message:', err);
      // Show error to user
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
      // Ensure input stays focused
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[90px] bg-white border-t border-gray-200 p-2 lg:p-3">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 h-full">
          <div className="flex-1 bg-gray-50 rounded-full border border-gray-200 overflow-hidden focus-within:border-accent-text focus-within:ring-1 focus-within:ring-accent-text/20">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-transparent border-none text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-0 text-base"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="w-12 h-12 rounded-full bg-accent-text text-white hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center shadow-sm"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}