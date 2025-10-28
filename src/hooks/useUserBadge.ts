import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BadgeData {
  badge_id: string;
  badge_name: string;
  display_name: string;
  description: string;
  icon_url: string;
  category: string;
  metadata: any;
}

export function useUserBadge(userId: string | null) {
  const [badge, setBadge] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setBadge(null);
      setLoading(false);
      return;
    }

    fetchUserBadge();
  }, [userId]);

  const fetchUserBadge = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_displayed_badge', { user_uuid: userId });

      if (error) throw error;
      setBadge(data?.[0] || null);
    } catch (error) {
      console.error('Error fetching user badge:', error);
      setBadge(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshBadge = () => {
    if (userId) {
      fetchUserBadge();
    }
  };

  return { badge, loading, refreshBadge };
}





