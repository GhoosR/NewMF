import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, Clock, Bookmark, Image, UtensilsCrossed, BookOpen, CreditCard, Award, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../lib/hooks/useAdmin';

interface ProfileTabsProps {
  userId: string;
  username: string;
  isOwnProfile?: boolean;
}

export function ProfileTabs({ userId, username, isOwnProfile = false }: ProfileTabsProps) {
  const location = useLocation();
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const { isAdmin } = useAdmin();
  
  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setShowPaymentSettings(user?.id === userId);
    };
    checkOwnership();
  }, [userId]);

  const tabs = [
    { name: 'Listings', path: 'listings', icon: List },
    { name: 'Posts', path: 'timeline', icon: Clock },
    ...(showPaymentSettings ? [{ name: 'Bookmarks', path: 'bookmarks', icon: Bookmark }] : []),
    { name: 'Recipes', path: 'recipes', icon: UtensilsCrossed },
    ...(isAdmin ? [{ name: 'Courses', path: 'courses', icon: BookOpen }] : []),
    ...(isOwnProfile ? [{ name: 'Badges', path: 'badges', icon: Award }] : []),
    ...(showPaymentSettings ? [{ name: 'Bookings', path: 'bookings', icon: Calendar }] : []),
    ...(showPaymentSettings ? [{ name: 'Payment Settings', path: 'payment-settings', icon: CreditCard }] : [])
  ];

  return (
    <div className="w-full">
      {/* Desktop: Horizontal tabs */}
      <nav className="hidden md:flex space-x-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const fullPath = `/profile/${username}/${tab.path}`;
          const isActive = location.pathname === fullPath;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={fullPath}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-accent-text text-accent-text'
                  : 'border-transparent text-content/60 hover:text-content'
              }`}
            >
              <span className="font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile: Vertical list */}
      <nav className="md:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-accent-text/10 overflow-hidden space-y-1 p-2">
          {tabs.map((tab) => {
            const fullPath = `/profile/${username}/${tab.path}`;
            const isActive = location.pathname === fullPath;
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.path}
                to={fullPath}
                className={`flex items-center px-4 py-4 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent-text text-white shadow-sm'
                    : 'text-content hover:bg-accent-base/10'
                }`}
              >
                <div className={`p-2 rounded-lg mr-4 ${
                  isActive ? 'bg-white/20' : 'bg-accent-base/10'
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-accent-text'}`} />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-base">{tab.name}</span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}