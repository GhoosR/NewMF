import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, User, Calendar, MapPin, Building2, BookOpen, UtensilsCrossed } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { searchAll } from '../lib/search';
import { Avatar } from '../components/Profile/Avatar';
import type { SearchResult } from '../types/search';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchAll(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'practitioner': return <User className="h-4 w-4" />;
      case 'event': return <Calendar className="h-4 w-4" />;
      case 'venue': return <MapPin className="h-4 w-4" />;
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'recipe': return <UtensilsCrossed className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/60" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search practitioners, events, venues, courses..."
          className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border border-accent-text/20 focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 transition-colors"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-accent-text" />
        )}
      </div>

      <div className="mt-6">
        {query.trim() && !loading && results.length === 0 ? (
          <div className="text-center text-content/60 py-8">
            No results found for "{query}"
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  switch (result.type) {
                    case 'practitioner': navigate(`/practitioners/${result.id}`); break;
                    case 'event': navigate(`/events/${result.id}`); break;
                    case 'venue': navigate(`/venues/${result.id}`); break;
                    case 'course': navigate(`/courses/${result.id}`); break;
                    case 'recipe': navigate(`/recipes/${result.id}`); break;
                    case 'user': navigate(`/profile/${result.username || result.id}`); break;
                  }
                }}
                className="w-full p-4 flex items-start space-x-3 hover:bg-accent-base/5 rounded-lg text-left transition-colors"
              >
                {result.type === 'user' ? (
                  <Avatar url={undefined} size="sm" userId={result.id} editable={false} />
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-base/20 flex items-center justify-center text-accent-text">
                    {getIcon(result.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-content truncate">
                      {result.title}
                    </p>
                    <span className="ml-2 text-xs text-content/60 capitalize">
                      {result.type}
                    </span>
                  </div>
                  {result.description && (
                    <p className="mt-1 text-sm text-content/60 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}