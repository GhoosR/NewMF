import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { CommunityList } from './CommunityList';
import type { Community } from '../../types/communities';

type FilterType = 'newest' | 'popular';

export function CommunitiesSidebar() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        let query = supabase
          .from('communities')
          .select(`
            *,
            _count: community_members(count)
          `);

        if (activeFilter === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else {
          // For popular, we'll order by member count
          query = query.order('_count', { ascending: false });
        }

        const { data } = await query.limit(5);
        setCommunities(data || []);
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
        <Link to="/events" className="text-sm text-accent-text hover:text-accent-text/80">
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