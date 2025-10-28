import { Link } from 'react-router-dom';

interface BadgeData {
  badge_id: string;
  badge_name: string;
  display_name: string;
  description: string;
  icon_url: string;
  category: string;
  metadata: any;
}

interface BadgeDisplayProps {
  badge: BadgeData | null;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export function BadgeDisplay({ 
  badge, 
  size = 'sm', 
  showTooltip = true, 
  className = '' 
}: BadgeDisplayProps) {
  if (!badge) return null;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  const getTooltipContent = () => {
    // Simplified tooltips - just show the badge name
    return badge.display_name;
  };

  const getClickLink = () => {
    if (badge.badge_name === 'community_builder') {
      const communities = badge.metadata?.communities || [];
      const primaryCommunityId = badge.metadata?.primary_community_id;
      
      if (communities.length > 0) {
        // Link to primary community if set, otherwise first community
        const targetCommunity = primaryCommunityId 
          ? communities.find((c: any) => c.community_id === primaryCommunityId)
          : communities[0];
        
        if (targetCommunity) {
          return `/communities/${targetCommunity.community_id}`;
        }
      } else if (badge.metadata?.community_id) {
        return `/communities/${badge.metadata.community_id}`;
      }
    } else if (badge.badge_name === 'field_master') {
      const fields = badge.metadata?.fields || [];
      const primaryFieldId = badge.metadata?.primary_field_id;
      
      if (fields.length > 0) {
        // Link to primary field if set, otherwise first field
        const targetField = primaryFieldId 
          ? fields.find((f: any) => f.field_id === primaryFieldId)
          : fields[0];
        
        if (targetField) {
          return `/agriculture/fields/${targetField.field_id}`;
        }
      } else if (badge.metadata?.field_id) {
        return `/agriculture/fields/${badge.metadata.field_id}`;
      }
    } else if (badge.badge_name === 'recipe_master') {
      // Recipe master badge is non-clickable, only shows tooltip
      return null;
    }
    return null;
  };

  const badgeElement = (
    <img
      src={badge.icon_url}
      alt={badge.display_name}
      className={`${sizeClasses[size]} ${className}`}
      title={showTooltip ? badge.display_name : undefined}
    />
  );

  const clickLink = getClickLink();
  
  if (clickLink && showTooltip) {
    return (
      <div className="group relative inline-block">
        <Link to={clickLink} className="block">
          {badgeElement}
        </Link>
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {getTooltipContent()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }

  // For non-clickable badges, still show tooltip if enabled
  if (showTooltip) {
    return (
      <div className="group relative inline-block">
        {badgeElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {getTooltipContent()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return badgeElement;
}

export default BadgeDisplay;
