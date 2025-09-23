import React, { useState, useEffect } from 'react';
import { X, Crown, Calendar, UserMinus, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatDate } from '../../lib/utils/dateUtils';

interface Member {
  id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'admin';
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
    verified?: boolean;
  };
}

interface MembersListModalProps {
  communityId: string;
  communityName: string;
  isOwner: boolean;
  onClose: () => void;
  onMemberRemoved?: () => void;
}

export function MembersListModal({ 
  communityId, 
  communityName, 
  isOwner, 
  onClose, 
  onMemberRemoved 
}: MembersListModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select(`
          *,
          user:users!community_members_user_id_fkey (
            username,
            avatar_url,
            verified
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberUsername: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberUsername} from this community?`)) {
      return;
    }

    try {
      setRemovingMember(memberId);
      
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state with animation
      setMembers(prev => prev.filter(m => m.id !== memberId));
      onMemberRemoved?.();
    } catch (err: any) {
      console.error('Error removing member:', err);
      alert('Failed to remove member. Please try again.');
    } finally {
      setRemovingMember(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      default:
        return 'Member';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text mx-auto"></div>
            <p className="mt-4 text-content/60">Loading members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-accent-text/10 bg-accent-base/5">
          <div>
            <h3 className="text-lg font-semibold text-content">{communityName}</h3>
            <p className="text-sm text-content/60">{members.length} members</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Members List */}
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-accent-text/10">
            {members.map((member) => (
              <div 
                key={member.id} 
                className={`p-4 flex items-center justify-between transition-all duration-300 ${
                  removingMember === member.id ? 'opacity-50 scale-95' : 'hover:bg-accent-base/5'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar
                    url={member.user.avatar_url}
                    size="md"
                    userId={member.user_id}
                    editable={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Username
                        username={member.user.username}
                        userId={member.user_id}
                        verified={member.user.verified}
                        className="font-medium text-content truncate"
                      />
                      {getRoleIcon(member.role) && (
                        <div className="flex items-center space-x-1 px-2 py-0.5 bg-accent-base/10 rounded-full">
                          {getRoleIcon(member.role)}
                          <span className="text-xs font-medium text-content">
                            {getRoleLabel(member.role)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-content/60">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Joined {formatDate(member.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {isOwner && member.role !== 'admin' && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.user.username)}
                    disabled={removingMember === member.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    title={`Remove ${member.user.username}`}
                  >
                    <UserMinus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {members.length === 0 && !loading && (
          <div className="p-8 text-center text-content/60">
            <p>No members found</p>
          </div>
        )}
      </div>
    </div>
  );
}