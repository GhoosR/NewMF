import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Loader2, User, Calendar, MapPin, Building2, BookOpen, UtensilsCrossed } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { searchAll } from '../../lib/search';
import { Avatar } from '../Profile/Avatar';
import type { SearchResult } from '../../types/search';

interface SearchBarProps {
  onResultClick?: () => void;
}

export function SearchBar({ onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get current country from URL parameters
  const currentCountry = searchParams.get('country');

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchAll(debouncedQuery, currentCountry || undefined);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleResultClick = (result: SearchResult) => {
    let path = '';
    switch (result.type) {
      case 'practitioner': path = `/practitioners/${result.slug}`; break;
      case 'event': path = `/events/${result.slug}`; break;
      case 'venue': path = `/venues/${result.slug}`; break;
      case 'course': path = `/courses/${result.slug}`; break;
      case 'recipe': path = `/recipes/${result.slug}`; break;
      case 'user': path = `/profile/${result.username}/listings`; break;
    }
    navigate(path);
    setShowResults(false);
    setQuery('');
    onResultClick?.();
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search practitioners, events, venues, courses..."
          className="w-full pl-12 pr-12 py-3 bg-white border border-accent-text/20 rounded-2xl focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 placeholder:text-content/40 transition-all hover:border-accent-text/40"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-accent-text" />
        )}
      </div>

      {showResults && (query.trim() || results.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-lg border border-accent-text/10 max-h-[80vh] overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-content/60 text-center">
              {loading ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            <div className="divide-y divide-accent-text/10">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-4 flex items-start space-x-3 hover:bg-accent-base/5 text-left transition-colors"
                >
                  {result.type === 'user' && result.avatar_url ? (
                    <Avatar url={result.avatar_url} size="sm" username={result.username} editable={false} />
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
                    {result.country && (
                      <p className="mt-1 text-xs text-content/50">
                        📍 {result.country}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}