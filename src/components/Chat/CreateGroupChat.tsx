import React, { useState } from 'react';
import { X, Plus, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';

interface CreateGroupChatProps {
  onClose: () => void;
  onSuccess: (conversationId: string) => void;
}

export function CreateGroupChat({ onClose, onSuccess }: CreateGroupChatProps) {
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleSelectUser = (user: any) => {
    if (selectedUsers.length >= 4) {
      setError('Maximum 5 participants allowed (including you)');
      return;
    }
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please add at least one participant');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user data including username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      const username = userData.username;

      let imageUrl = '';
      if (image) {
        try {
          // Upload image with a more reliable path structure
          const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { data: imageData, error: imageError } = await supabase.storage
            .from('group-chat-images')
            .upload(filePath, image, {
              cacheControl: '3600',
              upsert: true
            });

          if (imageError) {
            console.error('Error uploading image:', imageError);
            setError('Failed to upload group image. Please try again.');
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('group-chat-images')
            .getPublicUrl(imageData.path);

          imageUrl = publicUrl;
        } catch (err: any) {
          console.error('Storage error:', err);
          setError('Failed to upload group image. Please try again.');
          return;
        }
      }

      // Ensure unique participants
      const uniqueParticipantIds = Array.from(new Set([user.id, ...selectedUsers.map(u => u.id)]));
      
      // Validate participant count
      if (uniqueParticipantIds.length < 2) {
        throw new Error('Group must have at least 2 unique participants');
      }
      if (uniqueParticipantIds.length > 5) {
        throw new Error('Group cannot have more than 5 participants');
      }

      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'group',
          name,
          image_url: imageUrl,
          created_by: user.id,
          admin_id: user.id,
          max_participants: 5,
          participant_ids: uniqueParticipantIds,
          last_message: `${username} created the group`,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;
      onSuccess(conversation.id);
    } catch (err: any) {
      console.error('Error creating group chat:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start lg:items-center justify-center z-50">
      <div className="bg-white w-full min-h-screen lg:min-h-0 lg:rounded-lg lg:max-w-md lg:max-h-[90vh] lg:my-8 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Create Group Chat</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Group Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {image ? (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Group"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-accent-text text-white p-1 rounded-full cursor-pointer">
                <Plus className="h-4 w-4" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-accent-text focus:border-accent-text"
              placeholder="Enter group name"
            />
          </div>

          {/* Participant Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Participants ({selectedUsers.length}/4)
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-accent-text focus:border-accent-text"
              placeholder="Search users..."
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                {searchResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-2 hover:bg-gray-50 flex items-center gap-2 text-left"
                  >
                    <Avatar url={user.avatar_url} size="sm" userId={user.id} editable={false} />
                    <Username username={user.username} userId={user.id} />
                  </button>
                ))}
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar url={user.avatar_url} size="sm" userId={user.id} editable={false} />
                      <Username username={user.username} userId={user.id} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || selectedUsers.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
