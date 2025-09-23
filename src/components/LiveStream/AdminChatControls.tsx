import React, { useState, useEffect } from 'react';
import { Settings, Trash2, UserX, MessageSquareOff, MessageSquare, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';

interface AdminChatControlsProps {
  isAdmin: boolean;
}

interface MutedUser {
  id: string;
  user_id: string;
  reason?: string;
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

export function AdminChatControls({ isAdmin }: AdminChatControlsProps) {
  const [showControls, setShowControls] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [mutedUsers, setMutedUsers] = useState<MutedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchChatSettings();
      fetchMutedUsers();
    }
  }, [isAdmin]);

  const fetchChatSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('live_stream_settings')
        .select('chat_enabled')
        .limit(1)
        .single();

      if (error) throw error;
      setChatEnabled(data?.chat_enabled ?? true);
    } catch (err) {
      console.error('Error fetching chat settings:', err);
    }
  };

  const fetchMutedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('muted_users')
        .select(`
          *,
          user:users (
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMutedUsers(data || []);
    } catch (err) {
      console.error('Error fetching muted users:', err);
    }
  };

  const toggleChat = async () => {
    try {
      const { error } = await supabase
        .from('live_stream_settings')
        .update({ chat_enabled: !chatEnabled })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      setChatEnabled(!chatEnabled);
    } catch (err) {
      console.error('Error toggling chat:', err);
    }
  };

  const clearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all chat messages? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('live_chat_messages')
        .delete()
        .gt('created_at', '1970-01-01T00:00:00.000Z');

      if (error) throw error;
      
      // Trigger a custom event to refresh the chat
      window.dispatchEvent(new CustomEvent('chat-cleared'));
    } catch (err) {
      console.error('Error clearing chat:', err);
      alert('Failed to clear chat');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .not('id', 'in', `(${mutedUsers.map(m => `'${m.user_id}'`).join(',')})`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const muteUser = async (userId: string, reason?: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('muted_users')
        .insert([{
          user_id: userId,
          muted_by: user.id,
          reason: reason || 'Muted by admin'
        }]);

      if (error) throw error;
      
      setSearchQuery('');
      setSearchResults([]);
      await fetchMutedUsers();
    } catch (err) {
      console.error('Error muting user:', err);
      alert('Failed to mute user');
    } finally {
      setLoading(false);
    }
  };

  const unmuteUser = async (mutedUserId: string) => {
    try {
      const { error } = await supabase
        .from('muted_users')
        .delete()
        .eq('id', mutedUserId);

      if (error) throw error;
      await fetchMutedUsers();
    } catch (err) {
      console.error('Error unmuting user:', err);
      alert('Failed to unmute user');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowControls(!showControls)}
        className="flex items-center px-3 py-2 text-sm bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
      >
        <Settings className="h-4 w-4 mr-2" />
        Admin Controls
      </button>

      {showControls && (
        <div className="mt-4 bg-white border border-accent-text/20 rounded-lg p-4 space-y-4">
          {/* Chat Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleChat}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                chatEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {chatEnabled ? (
                <>
                  <MessageSquareOff className="h-4 w-4 mr-2" />
                  Disable Chat
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enable Chat
                </>
              )}
            </button>

            <button
              onClick={clearChat}
              className="flex items-center px-3 py-2 text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </button>
          </div>

          {/* User Search and Mute */}
          <div>
            <h4 className="text-sm font-medium text-content mb-2">Mute User</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search users to mute..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-accent-text/10 rounded-lg divide-y divide-accent-text/10 max-h-40 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="p-3 flex items-center justify-between hover:bg-accent-base/5">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        url={user.avatar_url}
                        size="sm"
                        userId={user.id}
                        editable={false}
                      />
                      <Username
                        username={user.username}
                        userId={user.id}
                        className="text-sm font-medium text-content"
                      />
                    </div>
                    <button
                      onClick={() => muteUser(user.id)}
                      disabled={loading}
                      className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Mute
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Muted Users List */}
          {mutedUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-content mb-2">Muted Users ({mutedUsers.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mutedUsers.map((mutedUser) => (
                  <div key={mutedUser.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        url={mutedUser.user.avatar_url}
                        size="sm"
                        userId={mutedUser.user_id}
                        editable={false}
                      />
                      <div>
                        <Username
                          username={mutedUser.user.username}
                          userId={mutedUser.user_id}
                          className="text-sm font-medium text-content"
                        />
                        {mutedUser.reason && (
                          <p className="text-xs text-content/60">{mutedUser.reason}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => unmuteUser(mutedUser.id)}
                      className="text-xs text-green-600 hover:text-green-700 px-2 py-1 hover:bg-green-50 rounded-md transition-colors"
                    >
                      Unmute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}