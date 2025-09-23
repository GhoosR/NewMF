import React from 'react';
import { X, Crown, Calendar } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';

interface FieldMember {
  id: string;
  user_id: string;
  created_at: string;
  isOwner: boolean;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

interface FieldMembersModalProps {
  members: FieldMember[];
  onClose: () => void;
}

export function FieldMembersModal({ members, onClose }: FieldMembersModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
          <h3 className="text-lg font-semibold text-content">Field Members</h3>
          <button
            onClick={onClose}
            className="p-2 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-accent-text/10">
            {members.map((member) => (
              <div key={member.id} className="p-4 flex items-center space-x-3">
                <Avatar
                  url={member.user?.avatar_url}
                  size="md"
                  userId={member.user_id}
                  editable={false}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Username
                      username={member.user?.username || 'Anonymous'}
                      userId={member.user_id}
                      className="font-medium text-content"
                    />
                    {member.isOwner && (
                      <div className="flex items-center px-2 py-0.5 bg-accent-text/10 text-accent-text text-xs rounded-full">
                        <Crown className="h-3 w-3 mr-1" />
                        Owner
                      </div>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-content/60">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {member.isOwner ? 'Created' : 'Joined'} {new Date(member.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}