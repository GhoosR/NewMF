import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CommunityList } from './CommunityList';
import type { Community } from '../../types/communities';

type FilterType = 'newest' | 'popular';

export function NewsFeedSidebar() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        // First fetch communities
        const { data: communitiesData, error: communitiesError } = await supabase
          .from('communities')
          .select('*');

        if (communitiesError) throw communitiesError;

        if (!communitiesData) {
          setCommunities([]);
          return;
        }

        // Then fetch member counts for each community
        const communitiesWithCounts = await Promise.all(
          communitiesData.map(async (community) => {
            const { count } = await supabase
              .from('community_members')
              .select('*', { count: 'exact', head: true })
              .eq('community_id', community.id);

            return {
              ...community,
              _count: {
                members: count || 0
              }
            };
          })
        );

        // Sort based on active filter
        let sortedCommunities;
        if (activeFilter === 'newest') {
          sortedCommunities = communitiesWithCounts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          // For popular, sort by member count
          sortedCommunities = communitiesWithCounts.sort((a, b) => 
            (b._count?.members || 0) - (a._count?.members || 0)
          );
        }

        setCommunities(sortedCommunities.slice(0, 5));
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCommunities();
  }, [activeFilter]);

  return (
    <div className="bg-background rounded-lg shadow-sm p-4 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-content">Communities</h2>
        <Link to="/communities" className="text-sm text-accent-text hover:text-accent-text/80">
          View All
        </Link>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveFilter('newest')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeFilter === 'newest'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setActiveFilter('popular')}
          className={`px-3 py-1 text-sm rounded-full ${
            activeFilter === 'popular'
              ? 'bg-accent-text text-white'
              : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
          }`}
        >
          Popular
        </button>
      </div>

      <CommunityList 
        communities={communities} 
        loading={loading} 
      />
    </div>
  );
}