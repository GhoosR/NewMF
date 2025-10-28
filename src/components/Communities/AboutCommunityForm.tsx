import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Modal } from '../Modal';
import { Avatar } from '../Profile/Avatar';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url?: string;
  username?: string;
}

interface AboutCommunityFormProps {
  communityId: string;
  currentAbout?: {
    about_text?: string;
    team_members?: TeamMember[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function AboutCommunityForm({ 
  communityId, 
  currentAbout, 
  onClose, 
  onSuccess 
}: AboutCommunityFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aboutText, setAboutText] = useState(currentAbout?.about_text || '');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    currentAbout?.team_members || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Search users function
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('communities')
        .update({
          about_text: aboutText,
          team_members: teamMembers
        })
        .eq('id', communityId);

      if (updateError) throw updateError;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTeamMemberFromSearch = (user: any) => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      user_id: user.id,
      name: user.full_name || user.username,
      role: '',
      bio: '',
      avatar_url: user.avatar_url,
      username: user.username
    };
    setTeamMembers([...teamMembers, newMember]);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === id ? { ...member, [field]: value } : member
      )
    );
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== id));
  };

  return (
    <Modal title="Edit About Page" onClose={onClose}>
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* About Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Us
            </label>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-text"
              placeholder="Tell us about your community, mission, and values..."
            />
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Team Members
              </label>
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="inline-flex items-center px-3 py-1 text-sm bg-accent-text text-white rounded-md hover:bg-accent-text/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Member
              </button>
            </div>

            {/* User Search */}
            {showSearch && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for users by name or username..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-text"
                  />
                </div>

                {/* Search Results */}
                {searchQuery && (
                  <div className="mt-3 max-h-48 overflow-y-auto">
                    {searchLoading ? (
                      <div className="text-center py-2 text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => addTeamMemberFromSearch(user)}
                            className="w-full flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md text-left"
                          >
                            <div className="flex-shrink-0">
                              <Avatar
                                url={user.avatar_url}
                                size="sm"
                                userId={user.id}
                                editable={false}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {user.full_name || user.username}
                              </div>
                              <Link 
                                to={`/profile/${user.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-accent-text hover:text-accent-text/80 transition-colors"
                              >
                                @{user.username}
                              </Link>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500">No users found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Avatar
                          url={member.avatar_url}
                          size="md"
                          userId={member.user_id}
                          editable={false}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        {member.username && (
                          <p className="text-sm text-gray-500">@{member.username}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(member.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={member.role}
                        onChange={(e) => updateTeamMember(member.id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-text"
                        placeholder="e.g., Founder, Community Manager"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={member.bio}
                      onChange={(e) => updateTeamMember(member.id, 'bio', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-text"
                      placeholder="Tell us about this team member..."
                    />
                  </div>
                </div>
              ))}

              {teamMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No team members added yet</p>
                  <p className="text-sm">Click "Add Member" to search for users</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-accent-text text-white rounded-md hover:bg-accent-text/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
