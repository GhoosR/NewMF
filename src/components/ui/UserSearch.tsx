import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Avatar } from '../Profile/Avatar';
import { Search } from 'lucide-react';

interface UserSearchProps {
  onSelect: (user: any) => void;
  placeholder?: string;
  excludeUserIds?: string[];
}

export function UserSearch({ onSelect, placeholder = 'Search users...', excludeUserIds = [] }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return;

        // Build the query
        let userQuery = supabase
          .from('users')
          .select('id, username, avatar_url')
          .ilike('username', `%${query}%`)
          .neq('id', currentUser.id) // Exclude current user
          .limit(10);

        // Exclude specified users
        if (excludeUserIds.length > 0) {
          userQuery = userQuery.not('id', 'in', `(${excludeUserIds.join(',')})`);
        }

        const { data, error } = await userQuery;

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query, excludeUserIds]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-text"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="divide-y divide-accent-text/10">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelect(user)}
              className="w-full p-3 flex items-center gap-3 hover:bg-accent-base/5 transition-colors text-left"
            >
              <Avatar
                url={user.avatar_url}
                size="sm"
                userId={user.id}
                editable={false}
              />
              <span className="font-medium text-content">{user.username}</span>
            </button>
          ))}
        </div>
      ) : query.trim() ? (
        <div className="text-center py-4 text-content/60">
          No users found
        </div>
      ) : null}
    </div>
  );
}




