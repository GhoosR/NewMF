import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { formatDate } from '../../lib/utils/dateUtils';
import type { Community } from '../../types/communities';

// Official group owner ID
const OFFICIAL_OWNER_ID = '8a5791a8-8dbc-4c49-a146-f5768d0007ed';

interface CommunityCardProps {
  community: Community;
  disabled?: boolean;
}

export function CommunityCard({ community, disabled }: CommunityCardProps) {
  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 ${
      disabled ? 'opacity-80' : ''
    }`}>
      {/* Banner Image */}
      <div className="h-32 sm:h-40 bg-gradient-to-r from-accent-base/5 to-accent-base/10 relative overflow-hidden">
        {community.banner_url && (
          <img
            src={community.banner_url}
            alt={community.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
        
        {community.owner_id === OFFICIAL_OWNER_ID && (
          <div className="absolute top-3 right-3 bg-accent-text text-white text-xs px-2 py-1 rounded-full shadow-md">
            Official
          </div>
        )}
        
      </div>
      
      {/* Content Section - With proper spacing for avatar */}
      <div className="p-5 pt-12 relative">
        {/* Avatar - Positioned to overlap banner but fully visible */}
        <div className="absolute -top-8 left-4 ring-4 ring-white rounded-full shadow-md">
          <Avatar 
            url={community.avatar_url} 
            size="md"
            userId={community.owner_id}
            editable={false}
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-content line-clamp-1 pr-6">
            {community.name}
          </h3>
          {community.type === 'private' && (
            <Lock className="h-4 w-4 text-content/60 flex-shrink-0" />
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-content/60 mb-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{community._count?.members || 0} members</span>
          </div>
          <span className="text-content/30">•</span>
          <span className="px-2 py-0.5 bg-accent-base/10 rounded-full text-xs">
            {community.type === 'private' ? 'Private' : 'Public'}
          </span>
        </div>
        
        <p className="text-content/80 text-sm line-clamp-2 mb-4 leading-relaxed">
          {community.description || "Join this community to connect with like-minded individuals."}
        </p>
        
        <div className="flex items-center justify-between text-sm mt-auto pt-2 border-t border-accent-text/5">
          <span className="text-content/50 text-xs">
            Created {formatDate(community.created_at)}
          </span>
          <span className="text-accent-text font-medium">
            {disabled ? 'Sign in to View' : 'View Community'}
          </span>
        </div>
      </div>
    </div>
  );

  if (disabled) {
    return <div className="relative">{CardContent()}</div>;
  }

  return (
    <Link to={`/communities/${community.id}`}>
      {CardContent()}
    </Link>
  );
}