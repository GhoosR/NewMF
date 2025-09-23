import React, { useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { europeanCountries } from '../../lib/constants/countries';
import { Modal } from '../Modal';

interface CreateFieldModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateFieldModal({ onClose, onSuccess }: CreateFieldModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: '',
    invitees: [] as { id: string; username: string; avatar_url?: string }[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

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
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const addInvitee = (user: { id: string; username: string; avatar_url?: string }) => {
    if (!formData.invitees.some(i => i.id === user.id)) {
      setFormData(prev => ({
        ...prev,
        invitees: [...prev.invitees, user]
      }));
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInvitee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      invitees: prev.invitees.filter(i => i.id !== userId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.country) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Create field and get the ID
      const { data: field, error: insertError } = await supabase
        .from('fields')
        .insert([{
          name: formData.name,
          description: formData.description,
          country: formData.country,
          owner_id: user.id
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Create invitations for selected users
      if (formData.invitees.length > 0) {
        const { error: inviteError } = await supabase
          .from('field_invitations')
          .insert(
            formData.invitees.map(invitee => ({
              field_id: field.id,
              inviter_id: user.id,
              invitee_id: invitee.id
            }))
          );

        if (inviteError) throw inviteError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating field:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Field" onClose={onClose} fullScreenOnMobile={true}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Field Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              placeholder="Enter field name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              rows={3}
              placeholder="Describe your field (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Country *
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              required
            >
              <option value="">Select country</option>
              {europeanCountries.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Invite Members
            </label>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="Search users by username"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="border border-accent-text/10 rounded-lg divide-y divide-accent-text/10">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 flex items-center justify-between hover:bg-accent-base/5"
                    >
                      <div className="flex items-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-accent-base/20 flex items-center justify-center">
                            <span className="text-sm font-medium text-accent-text">
                              {user.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="ml-3 font-medium text-content">
                          {user.username}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addInvitee(user)}
                        className="p-1 text-accent-text hover:bg-accent-base/10 rounded-full"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.invitees.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-content mb-2">Selected Users</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.invitees.map((invitee) => (
                      <div
                        key={invitee.id}
                        className="inline-flex items-center px-2 py-1 rounded-full bg-accent-base/10 text-sm"
                      >
                        <span className="text-accent-text">{invitee.username}</span>
                        <button
                          type="button"
                          onClick={() => removeInvitee(invitee.id)}
                          className="ml-1 p-0.5 text-accent-text hover:bg-accent-base/20 rounded-full"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content hover:text-content/80 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Creating...' : 'Create Field'}
            </button>
          </div>
        </form>
    </Modal>
  );
}