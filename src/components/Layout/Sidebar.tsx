import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, LogIn, X } from 'lucide-react';
import { Logo } from '../Logo';
import { useAdmin } from '../../lib/hooks/useAdmin';
import { socialItems, discoverItems, learnItems, toolsItems } from '../../lib/constants/navigationItems';
import { Avatar } from '../Profile/Avatar';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/profile';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const [currentUser, setCurrentUser] = useState<{ id: string; avatar_url?: string } | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setCurrentUser(profile);
            setUsername(profile.username);
          } else {
            // Create profile if it doesn't exist
            const { data: newProfile } = await supabase
              .from('users')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                username: `user_${session.user.id.slice(0, 8)}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                avatar_url: null
              }])
              .select()
              .single();

            if (newProfile) {
              setCurrentUser(newProfile);
              setUsername(newProfile.username);
            }
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const wasAuthenticated = isAuthenticated;
      const isNowAuthenticated = !!session;
      setIsAuthenticated(isNowAuthenticated);

      // Only reload profile if auth state changes from false to true
      if (!wasAuthenticated && isNowAuthenticated) {
        loadProfile();
      } else if (!isNowAuthenticated) {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Remove isAuthenticated from dependencies to prevent loop

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const renderNavItem = (item: typeof socialItems[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
          isActive ? 'bg-gray-100' : ''
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-accent-text' : 'text-gray-500'}`} />
        <span className={`text-sm ${isActive ? 'text-content font-medium' : 'text-gray-600'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-background border-r border-gray-200 flex flex-col">
      {/* Close button - Mobile only */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-content/60 hover:text-content"
        >
          <X className="h-6 w-6" />
        </button>
      )}

      {/* Logo */}
      <div className="p-4">
        <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
          <Logo className="h-12 w-12 text-accent-text" />
          <span className="text-xl font-gelica font-bold text-content">Mindful Family</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* Social */}
        <div className="space-y-1">
          {socialItems.map(renderNavItem)}
        </div>

        {/* Discover */}
        <div>
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Discover
          </h3>
          <div className="space-y-1">
            {discoverItems.map(renderNavItem)}
          </div>
        </div>

        {/* Learn */}
        <div>
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Learn
          </h3>
          <div className="space-y-1">
            {learnItems.map(renderNavItem)}
          </div>
        </div>

        {/* Tools */}
        <div>
          <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Tools
          </h3>
          <div className="space-y-1">
            {toolsItems.map(renderNavItem)}
          </div>
        </div>

        {/* Admin */}
        {isAdmin && (
          <div>
            <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Admin
            </h3>
            <Link
              to="/admin"
              onClick={onClose}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="h-5 w-5">⚙️</span>
              <span className="text-sm text-gray-600">Dashboard</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-200">
        {isAuthenticated ? (
          <div className="relative">
            {currentUser ? (
              <>
                <Link
                  to={`/profile/${currentUser.username}/listings`}
                  onClick={onClose}
                  className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Avatar 
                    url={currentUser.avatar_url} 
                    size="sm"
                    username={currentUser.username}
                    editable={false}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {currentUser.username || 'Anonymous'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{currentUser.id.slice(0, 8)}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : loading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-text"></div>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('show-auth'));
              onClose?.();
            }}
            className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg bg-accent-text text-white hover:bg-accent-text/90 transition-colors"
          >
            <LogIn className="h-5 w-5" />
            <span className="text-sm font-medium">Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
}