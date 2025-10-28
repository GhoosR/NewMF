import { supabase } from './supabase';
import type { SearchResult } from '../types/search';

export async function searchAll(query: string, country?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    const { data, error } = await supabase
      .rpc('search_all', { 
        search_query: query,
        search_country: country || null
      });

    // Fetch user avatars for user results
    if (data) {
      const userResults = data.filter(result => result.type === 'user');
      if (userResults.length > 0) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, username, avatar_url')
          .in('id', userResults.map(u => u.id));

        if (userData) {
          data.forEach(result => {
            if (result.type === 'user') {
              const user = userData.find(u => u.id === result.id);
              if (user) {
                result.avatar_url = user.avatar_url;
                result.username = user.username;
              }
            }
          });
        }
      }
    }

    return data || [];
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
}