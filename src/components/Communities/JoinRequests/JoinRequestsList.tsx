import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../Profile/Avatar';

interface JoinRequest {
  id: string;
  community_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

interface JoinRequestsListProps {
  communityId: string;
  onRequestHandled: () => void;
}

export function JoinRequestsList({ communityId, onRequestHandled }: JoinRequestsListProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      try {
        const { data, error } = await supabase
          .from('community_join_requests')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('community_id', communityId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRequests(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRequests();
  }, [communityId]);

  const handleRequest = async (requestId: string, approved: boolean) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Start a transaction
      const { error: updateError } = await supabase
        .from('community_join_requests')
        .update({ status: approved ? 'approved' : 'rejected' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (approved) {
        // Add user as community member
        const { error: memberError } = await supabase
          .from('community_members')
          .insert([{
            community_id: communityId,
            user_id: request.user_id,
            role: 'member'
          }]);

        if (memberError) throw memberError;
      }

      // Update local state
      setRequests(prev => prev.filter(r => r.id !== requestId));
      onRequestHandled();
    } catch (err: any) {
      console.error('Error handling request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  if (requests.length === 0) {
    return <p className="text-content/60 p-4">No pending join requests</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between p-4 bg-accent-base/10 rounded-lg">
          <div className="flex items-center space-x-3">
            <Avatar
              url={request.user.avatar_url}
              size="sm"
              userId={request.user_id}
              editable={false}
            />
            <div>
              <p className="font-medium text-content">{request.user.username}</p>
              <p className="text-sm text-content/60">
                Requested {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => handleRequest(request.id, true)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-full"
              title="Approve"
            >
              <Check className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleRequest(request.id, false)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full"
              title="Reject"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}