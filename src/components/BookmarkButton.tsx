import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookmarkButtonProps {
  targetId: string;
  targetType: 'practitioners' | 'events' | 'venues' | 'jobs' | 'profiles' | 'timeline_posts' | 'community_posts';
  className?: string;
}

export function BookmarkButton({ targetId, targetType, className = '' }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkBookmarkStatus();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        checkBookmarkStatus();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [targetId, targetType]);

  const checkBookmarkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_id', targetId)
        .eq('target_type', targetType)
        .maybeSingle();

      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('show-auth'));
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('target_id', targetId)
          .eq('target_type', targetType);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert([{
            user_id: user.id,
            target_id: targetId,
            target_type: targetType
          }]);

        if (error) throw error;
        setIsBookmarked(true);
      }

      // Show notification
      setNotificationMessage(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleBookmark}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${
          isBookmarked 
            ? 'text-accent-text bg-accent-base/10' 
            : 'text-content/60 hover:text-accent-text hover:bg-accent-base/10'
        } ${className}`}
        title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
      </button>
      
      {/* Notification Popup */}
      {showNotification && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 animate-fade-in">
          {notificationMessage}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}