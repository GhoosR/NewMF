import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, X, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SearchBar } from '../Search/SearchBar';

export function MobileBottomNav() {
  const location = useLocation();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  React.useEffect(() => {
    // Check auth status
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUsername(profile.username);
        }
      }
    };
    getUserProfile();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        supabase
          .from('users')
          .select('username')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data) {
              setUsername(data.username);
            }
          });
      } else {
        setUserId(null);
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = (e: React.MouseEvent) => {
    if (!userId) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('show-auth'));
    }
  };
  
  const handleMessageClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('show-auth'));
    } else {
      setShowSearch(false);
    }
  };

  const handleNavigationClick = () => {
    setShowSearch(false);
  };

  return (
    <>
      {showSearch ? (
        <div className="fixed top-0 left-0 right-0 bottom-16 bg-white z-40 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-accent-text/10">
            <h2 className="text-lg font-medium text-content">Search</h2>
            <button
              onClick={() => setShowSearch(false)}
              className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <SearchBar onResultClick={() => setShowSearch(false)} />
          </div>
        </div>
      ) : null}
      
      {/* Bottom Navigation - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-accent-text/10 lg:hidden z-50 h-16 shadow-lg">
        <nav className="flex items-center justify-around h-16">
          <Link
            to="/"
            onClick={handleNavigationClick}
            aria-label="Home"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname === '/' ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            <Home className="h-6 w-6" />
          </Link>

          <button
            onClick={() => setShowSearch(true)}
            aria-label="Search"
            className="flex items-center justify-center w-14 h-14 rounded-full text-content/60"
          >
            <Search className="h-6 w-6" />
          </button>

          <Link
            to="/chat"
            onClick={handleMessageClick}
            aria-label="Messages"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname.includes('/chat') ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            <MessageSquare className="h-6 w-6" />
          </Link>

          <Link
            to={username ? `/profile/${username}/listings` : '#'}
            onClick={(e) => {
              handleProfileClick(e);
              handleNavigationClick();
            }}
            aria-label="Profile"
            className={`flex items-center justify-center w-14 h-14 rounded-full ${
              location.pathname.includes('/profile') ? 'text-accent-text' : 'text-content/60'
            }`}
          >
            <User className="h-6 w-6" />
          </Link>
        </nav>
      </div>
    </>
  );
}