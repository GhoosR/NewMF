import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Modal } from '../Modal';

interface AddMemberModalProps {
  fieldId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ fieldId, onClose, onSuccess }: AddMemberModalProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search users by username
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
    } catch (err: any) {
      console.error('Error searching users:', err);
    }
  };

  // Send invitation to user
  const inviteUser = async (userId) => {
  try {
    setLoading(true);
    setError('');

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from('field_invitations')
      .select('*')
      .eq('field_id', fieldId)
      .eq('invitee_id', userId)
      .not('status', 'eq', 'rejected')
      .maybeSingle();

    if (existingInvitation) {
      setError('User has already been invited to this field');
      return;
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('field_members')
      .select('*')
      .eq('field_id', fieldId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      setError('User is already a member of this field');
      return;
    }

    // Create invitation
    const { error: insertError } = await supabase
      .from('field_invitations')
      .insert([{
        field_id: fieldId,
        inviter_id: (await supabase.auth.getUser()).data.user?.id,
        invitee_id: userId
      }]);

    if (insertError) throw insertError;

    // Trigger success callback
    onSuccess();
  } catch (err) {
    console.error('Error inviting user:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <Modal title="Add Member" onClose={onClose} fullScreenOnMobile={true}>
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
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
                  className="p-4 flex items-center justify-between hover:bg-accent-base/5 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar
                      url={user.avatar_url}
                      size="sm"
                      userId={user.id}
                      editable={false}
                    />
                    <span className="ml-3 font-medium text-content">
                      {user.username}
                    </span>
                  </div>
                  <button
                    onClick={() => inviteUser(user.id)}
                    disabled={loading}
                    className="px-3 py-1 text-sm text-accent-text hover:bg-accent-text hover:text-white rounded-md transition-colors"
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>
    </Modal>
  );
}