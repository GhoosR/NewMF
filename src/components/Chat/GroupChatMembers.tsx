import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserSearch } from '../../components/ui/UserSearch';
import { Avatar } from '../../components/Profile/Avatar';
import { X, UserPlus, Crown } from 'lucide-react';

interface GroupChatMembersProps {
  conversationId: string;
  onClose: () => void;
  isAdmin: boolean;
}

interface Member {
  id: string;
  username: string;
  avatar_url: string | null;
}

export function GroupChatMembers({ conversationId, onClose, isAdmin }: GroupChatMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);

  console.log('GroupChatMembers - isAdmin:', isAdmin);

  useEffect(() => {
    fetchMembers();
  }, [conversationId]);

  const fetchMembers = async () => {
    try {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('participant_ids, admin_id')
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      setAdminId(conversation.admin_id);

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', conversation.participant_ids);

      if (usersError) throw usersError;

      setMembers(users);
    } catch (err: any) {
      console.error('Error fetching members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (user: any) => {
    try {
      console.log('Adding member:', user);
      console.log('Current members:', members);
      console.log('Is admin:', isAdmin);
      
      if (!isAdmin) {
        setError('Only the group admin can add members');
        return;
      }

      // Add member using the stored procedure
      console.log('Adding member using stored procedure:', {
        conversationId,
        newMemberId: user.id
      });

      const { data: result, error: updateError } = await supabase
        .rpc('add_group_chat_member', {
          conversation_id: conversationId,
          new_member_id: user.id
        });

      if (updateError) {
        console.error('Error adding member:', updateError);
        throw new Error(`Failed to add member: ${updateError.message}`);
      }

      if (!result.success) {
        console.error('Error from stored procedure:', result.error);
        throw new Error(`Failed to add member: ${result.error}`);
      }

      console.log('Member added successfully:', result);

      // Update local state
      setMembers([...members, user]);
      setShowAddMember(false);
    } catch (err: any) {
      console.error('Error adding member:', err);
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      console.log('Removing member:', memberId);
      console.log('Admin ID:', adminId);
      console.log('Current user is admin:', isAdmin);
      
      if (!isAdmin) {
        setError('Only the group admin can remove members');
        return;
      }

      // Remove member using the stored procedure
      console.log('Removing member using stored procedure:', {
        conversationId,
        memberId
      });

      const { data: result, error: updateError } = await supabase
        .rpc('remove_group_chat_member', {
          conversation_id: conversationId,
          member_id: memberId
        });

      if (updateError) {
        console.error('Error removing member:', updateError);
        throw new Error(`Failed to remove member: ${updateError.message}`);
      }

      if (!result.success) {
        console.error('Error from stored procedure:', result.error);
        throw new Error(`Failed to remove member: ${result.error}`);
      }

      console.log('Member removed successfully:', result);

      // Update local state
      setMembers(members.filter(member => member.id !== memberId));
    } catch (err: any) {
      console.error('Error removing member:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg w-full max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Group Members</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Admin status indicator */}
          <div className="bg-accent-base/10 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-content/70">
              <Crown size={16} className="text-yellow-500" />
              <span>Group Admin: {members.find(m => m.id === adminId)?.username || 'Loading...'}</span>
            </div>
          </div>

          {/* Members list */}
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <Avatar url={member.avatar_url} userId={member.id} size="sm" editable={false} />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.username}</span>
                  {member.id === adminId && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                </div>
              </div>
              {isAdmin && member.id !== adminId && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                  title="Remove member"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Admin controls */}
        {isAdmin ? (
          <div className="mt-6 border-t border-accent-text/10 pt-6">
            {showAddMember ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Add New Member</h3>
                  <button
                    onClick={() => setShowAddMember(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                </div>
                <UserSearch
                  onSelect={handleAddMember}
                  placeholder="Search for users to add..."
                  excludeUserIds={members.map(m => m.id)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
              >
                <UserPlus size={20} />
                <span>Add New Member</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 border-t border-accent-text/10 pt-6 text-center text-sm text-content/60">
            Only the group admin can add or remove members
          </div>
        )}
      </div>
    </div>
  );
}
