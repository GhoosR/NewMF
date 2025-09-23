import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { formatDate } from '../../lib/utils/dateUtils';
import type { Community } from '../../types/communities';

// Official group owner ID
const OFFICIAL_OWNER_ID = '8a5791a8-8dbc-4c49-a146-f5768d0007ed';

interface CommunityListProps {
  communities: Community[];
  loading: boolean;
}

export function CommunityList({ communities, loading }: CommunityListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent-base/20 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-accent-base/20 rounded w-3/4" />
                <div className="h-3 bg-accent-base/20 rounded w-1/2 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <p className="text-content/60 text-center py-4">No communities found</p>
    );
  }

  return (
    <div className="space-y-4">
      {communities.map((community) => (
        <Link
          key={community.id}
          to={`/communities/${community.id}`}
          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent-base/5 transition-all duration-200 border border-transparent hover:border-accent-text/10"
        >
          <Avatar
            url={community.avatar_url}
            size="md"
            userId={community.owner_id}
            editable={false}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-content truncate group-hover:text-accent-text transition-colors">
                {community.name}
              </h3>
              {community.owner_id === OFFICIAL_OWNER_ID && (
                <span className="px-1.5 py-0.5 bg-accent-text/10 text-accent-text text-xs rounded-full">
                  Official
                </span>
              )}
              {community.type === 'private' && (
                <Lock className="h-3 w-3 text-content/60 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-content/60 mt-1">
              <Users className="h-3 w-3 mr-1" />
              <span>{community._count?.members || 0} members</span>
              <span className="text-content/30">•</span>
              <span className="text-content/60 text-xs">
                {formatDate(community.created_at)}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}