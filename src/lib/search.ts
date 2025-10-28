import { supabase } from './supabase';
import type { SearchResult } from '../types/search';

async function searchDirectly(query: string): Promise<SearchResult[]> {
  try {
    // Search users directly
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, username, bio, avatar_url, created_at')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(5);

    const userResults: SearchResult[] = (users || []).map(user => ({
      id: user.id,
      title: user.full_name || user.username,
      slug: user.username,
      description: user.bio,
      type: 'user' as const,
      username: user.username,
      avatar_url: user.avatar_url,
      country: null,
      created_at: user.created_at
    }));

    return userResults;
  } catch (error) {
    console.error('Direct search error:', error);
    return [];
  }
}

export async function searchAll(query: string, country?: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  
  try {
    // Try the RPC function first
    const { data, error } = await supabase
      .rpc('search_all', { 
        search_query: query
      });

    if (error) {
      console.error('Search RPC error:', error);
      
      // Fallback to direct table queries if RPC fails
      return await searchDirectly(query);
    }

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