import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Badge {
  badge_id: string;
  badge_name: string;
  display_name: string;
  description: string;
  icon_url: string;
  category: string;
  earned_at: string;
  metadata: any;
  is_displayed: boolean;
}

interface BadgeSelectorProps {
  userId: string;
  onBadgeChange?: (badge: Badge | null) => void;
}

export function BadgeSelector({ userId, onBadgeChange }: BadgeSelectorProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    fetchUserBadges();
    checkOwnership();
  }, [userId]);

  const checkOwnership = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsOwnProfile(user?.id === userId);
  };

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_badges', { user_uuid: userId });

      if (error) throw error;
      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeToggle = async (badgeId: string, isDisplayed: boolean) => {
    if (!isOwnProfile) return; // Security check
    
    setUpdating(badgeId);
    try {
      if (isDisplayed) {
        // Set this badge as displayed (will automatically unset others via trigger)
        const { error } = await supabase
          .from('user_badges')
          .update({ is_displayed: true })
          .eq('badge_id', badgeId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Unset this badge
        const { error } = await supabase
          .from('user_badges')
          .update({ is_displayed: false })
          .eq('badge_id', badgeId)
          .eq('user_id', userId);

        if (error) throw error;
      }

      // Update local state
      setBadges(prev => prev.map(badge => ({
        ...badge,
        is_displayed: badge.badge_id === badgeId ? isDisplayed : false
      })));

      // Notify parent component
      const updatedBadge = badges.find(b => b.badge_id === badgeId);
      if (updatedBadge && isDisplayed) {
        onBadgeChange?.(updatedBadge);
      } else if (!isDisplayed) {
        onBadgeChange?.(null);
      }
    } catch (error) {
      console.error('Error updating badge display:', error);
    } finally {
      setUpdating(null);
    }
  };

  const setPrimaryCommunity = async (badgeId: string, communityId: string) => {
    if (!isOwnProfile) return; // Security check
    
    setUpdating(badgeId);
    try {
      const badge = badges.find(b => b.badge_id === badgeId);
      if (!badge) return;

      const updatedMetadata = {
        ...badge.metadata,
        primary_community_id: communityId
      };

      const { error } = await supabase
        .from('user_badges')
        .update({ metadata: updatedMetadata })
        .eq('badge_id', badgeId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setBadges(prev => prev.map(b => 
        b.badge_id === badgeId 
          ? { ...b, metadata: updatedMetadata }
          : b
      ));

      // Notify parent component if this badge is displayed
      if (badge.is_displayed) {
        const updatedBadge = { ...badge, metadata: updatedMetadata };
        onBadgeChange?.(updatedBadge);
      }
    } catch (error) {
      console.error('Error setting primary community:', error);
    } finally {
      setUpdating(null);
    }
  };

  const setPrimaryField = async (badgeId: string, fieldId: string) => {
    if (!isOwnProfile) return; // Security check
    
    setUpdating(badgeId);
    try {
      const badge = badges.find(b => b.badge_id === badgeId);
      if (!badge) return;

      const updatedMetadata = {
        ...badge.metadata,
        primary_field_id: fieldId
      };

      const { error } = await supabase
        .from('user_badges')
        .update({ metadata: updatedMetadata })
        .eq('badge_id', badgeId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setBadges(prev => prev.map(b => 
        b.badge_id === badgeId 
          ? { ...b, metadata: updatedMetadata }
          : b
      ));

      // Notify parent component if this badge is displayed
      if (badge.is_displayed) {
        const updatedBadge = { ...badge, metadata: updatedMetadata };
        onBadgeChange?.(updatedBadge);
      }
    } catch (error) {
      console.error('Error setting primary field:', error);
    } finally {
      setUpdating(null);
    }
  };

  const setPrimaryRecipe = async (badgeId: string, recipeId: string) => {
    if (!isOwnProfile) return; // Security check
    
    setUpdating(badgeId);
    try {
      const badge = badges.find(b => b.badge_id === badgeId);
      if (!badge) return;

      const updatedMetadata = {
        ...badge.metadata,
        primary_recipe_id: recipeId
      };

      const { error } = await supabase
        .from('user_badges')
        .update({ metadata: updatedMetadata })
        .eq('badge_id', badgeId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setBadges(prev => prev.map(b => 
        b.badge_id === badgeId 
          ? { ...b, metadata: updatedMetadata }
          : b
      ));

      // Notify parent component if this badge is displayed
      if (badge.is_displayed) {
        const updatedBadge = { ...badge, metadata: updatedMetadata };
        onBadgeChange?.(updatedBadge);
      }
    } catch (error) {
      console.error('Error setting primary recipe:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
        <p className="text-sm">Start engaging with the community to earn your first badge!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Badges</h3>
        <p className="text-sm text-gray-600">
          Choose which badge to display next to your username
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.badge_id}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
              badge.is_displayed
                ? 'border-accent-text bg-accent-base/10'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Badge Icon */}
            <div className="flex items-center justify-center mb-3">
              <img
                src={badge.icon_url}
                alt={badge.display_name}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
              />
            </div>

            {/* Badge Info */}
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-1">
                {badge.display_name}
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                {badge.description}
              </p>
              <p className="text-xs text-gray-500">
                Given {new Date(badge.earned_at).toLocaleDateString()}
              </p>
            </div>

            {/* Display Toggle - Only show for own profile */}
            {isOwnProfile && (
              <div className="mt-3 flex justify-center">
                <button
                  onClick={() => handleBadgeToggle(badge.badge_id, !badge.is_displayed)}
                  disabled={updating === badge.badge_id}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                    badge.is_displayed
                      ? 'bg-accent-text text-white hover:bg-accent-text/90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${updating === badge.badge_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updating === badge.badge_id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                      Updating...
                    </div>
                  ) : badge.is_displayed ? (
                    'Displaying'
                  ) : (
                    'Display Badge'
                  )}
                </button>
              </div>
            )}

            {/* Community Builder specific info */}
            {badge.badge_name === 'community_builder' && badge.metadata?.communities && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                <div className="font-medium mb-1">Communities:</div>
                <div className="space-y-1">
                  {badge.metadata.communities.map((c: any) => (
                    <div key={c.community_id} className="flex items-center justify-between">
                      <span className="truncate">{c.community_name}</span>
                      {isOwnProfile && (
                        <button
                          onClick={() => setPrimaryCommunity(badge.badge_id, c.community_id)}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            badge.metadata.primary_community_id === c.community_id
                              ? 'bg-accent-text text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          disabled={updating === badge.badge_id}
                        >
                          {badge.metadata.primary_community_id === c.community_id ? 'Primary' : 'Set'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Primary community shows on hover
                </div>
              </div>
            )}

            {/* Field Master specific info */}
            {badge.badge_name === 'field_master' && badge.metadata?.fields && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                <div className="font-medium mb-1">Fields:</div>
                <div className="space-y-1">
                  {badge.metadata.fields.map((f: any) => (
                    <div key={f.field_id} className="flex items-center justify-between">
                      <span className="truncate">{f.field_name}</span>
                      {isOwnProfile && (
                        <button
                          onClick={() => setPrimaryField(badge.badge_id, f.field_id)}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            badge.metadata.primary_field_id === f.field_id
                              ? 'bg-accent-text text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          disabled={updating === badge.badge_id}
                        >
                          {badge.metadata.primary_field_id === f.field_id ? 'Primary' : 'Set'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Primary field shows on hover
                </div>
              </div>
            )}

            {/* Recipe Master specific info */}
            {badge.badge_name === 'recipe_master' && badge.metadata?.recipes && (
              <div className="mt-2 text-xs text-gray-500 text-center">
                <div className="font-medium mb-1">Recipes:</div>
                <div className="space-y-1">
                  {badge.metadata.recipes.map((r: any) => (
                    <div key={r.recipe_id} className="flex items-center justify-between">
                      <span className="truncate">{r.recipe_name}</span>
                      {isOwnProfile && (
                        <button
                          onClick={() => setPrimaryRecipe(badge.badge_id, r.recipe_id)}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            badge.metadata.primary_recipe_id === r.recipe_id
                              ? 'bg-accent-text text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          disabled={updating === badge.badge_id}
                        >
                          {badge.metadata.primary_recipe_id === r.recipe_id ? 'Primary' : 'Set'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Primary recipe shows on hover
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-500 mt-6">
        💡 Only one badge can be displayed at a time. Choose your favorite!
      </div>
    </div>
  );
}

export default BadgeSelector;
