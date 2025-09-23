import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { useDebounce } from '../../hooks/useDebounce';

interface User {
  id: string;
  username: string;
  avatar_url?: string;
}

interface UserMentionInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onMentionedUsersChange: (userIds: string[]) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function UserMentionInput({
  value,
  onChange,
  onMentionedUsersChange,
  placeholder,
  className,
  rows = 4
}: UserMentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedQuery = useDebounce(mentionQuery, 200);

  // Search for users when typing @
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUser?.id || '') // Exclude current user
        .limit(8);

      if (error) throw error;
      setSuggestions(data || []);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error searching users:', err);
      setSuggestions([]);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debouncedQuery && showSuggestions) {
      searchUsers(debouncedQuery);
    }
  }, [debouncedQuery, showSuggestions]);

  // Handle text change and detect @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(e);
    setCursorPosition(cursorPos);

    // Check if we're typing after an @
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const mentionStart = cursorPos - mentionMatch[0].length;
      
      setMentionQuery(query);
      setMentionStartPos(mentionStart);
      setShowSuggestions(true);
      setSelectedIndex(0);
      
      // Only search if we have at least 1 character after @
      if (query.length >= 1) {
        searchUsers(query);
      } else {
        setSuggestions([]);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setMentionQuery('');
    }

    // Extract mentioned usernames and get their IDs
    extractMentionedUsers(newValue);
  };

  // Extract mentioned users from text
  const extractMentionedUsers = async (text: string) => {
    const mentionMatches = text.match(/@(\w+)/g);
    if (!mentionMatches) {
      setMentionedUsers([]);
      onMentionedUsersChange([]);
      return;
    }

    const usernames = mentionMatches.map(match => match.substring(1));
    
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username')
        .in('username', usernames);

      if (error) throw error;
      
      const userIds = users?.map(user => user.id) || [];
      setMentionedUsers(userIds);
      onMentionedUsersChange(userIds);
    } catch (err) {
      console.error('Error fetching mentioned users:', err);
    }
  };

  // Handle user selection from suggestions
  const handleUserSelect = (user: User) => {
    const textBeforeMention = value.substring(0, mentionStartPos);
    const textAfterCursor = value.substring(cursorPosition);
    
    const newValue = `${textBeforeMention}@${user.username} ${textAfterCursor}`;
    
    // Create a synthetic event to pass to onChange
    const syntheticEvent = {
      target: {
        value: newValue,
        selectionStart: mentionStartPos + user.username.length + 2,
        selectionEnd: mentionStartPos + user.username.length + 2
      }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    
    onChange(syntheticEvent);
    
    // Update cursor position and close suggestions
    const newCursorPos = mentionStartPos + user.username.length + 2;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
    
    setShowSuggestions(false);
    setSuggestions([]);
    setMentionQuery('');
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleUserSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSuggestions([]);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Calculate suggestion position
  const getSuggestionPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    
    const textarea = textareaRef.current;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[lines.length - 1].length;
    
    // Approximate position calculation
    const lineHeight = 24; // Approximate line height
    const charWidth = 8; // Approximate character width
    
    return {
      top: (currentLine + 1) * lineHeight + 8,
      left: Math.min(currentColumn * charWidth, textarea.offsetWidth - 250)
    };
  };

  const suggestionPosition = getSuggestionPosition();

  return (
    <div ref={wrapperRef} className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-64 bg-white border border-accent-text/20 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          style={{
            top: `${suggestionPosition.top}px`,
            left: `${suggestionPosition.left}px`,
            minWidth: '280px'
          }}
        >
          <div className="p-2">
            <div className="text-xs text-content/60 px-2 py-1 border-b border-accent-text/10 mb-1">
              Mention someone
            </div>
            {suggestions.map((user, index) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  index === selectedIndex 
                    ? 'bg-accent-text/10 text-accent-text' 
                    : 'hover:bg-accent-base/10'
                }`}
              >
                <Avatar
                  url={user.avatar_url}
                  size="sm"
                  userId={user.id}
                  editable={false}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-content truncate block">
                    @{user.username}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}