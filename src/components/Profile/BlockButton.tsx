import React, { useState, useEffect } from 'react';
import { Ban } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BlockButtonProps {
  userId: string;
  onBlock?: () => void;
  className?: string;
}

export function BlockButton({ userId, onBlock, className = '' }: BlockButtonProps) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBlockStatus();
  }, [userId]);

  const checkBlockStatus = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('blocked_user_id', userId)
        .maybeSingle();

      setIsBlocked(!!data);
    } catch (error) {
      console.error('Error checking block status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isBlocked) {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('user_id', user.id)
          .eq('blocked_user_id', userId);

        if (error) throw error;
        setIsBlocked(false);
      } else {
        // Block user
        const { error } = await supabase
          .from('blocked_users')
          .insert([{
            user_id: user.id,
            blocked_user_id: userId
          }]);

        if (error) throw error;
        setIsBlocked(true);
      }

      onBlock?.();
    } catch (error) {
      console.error('Error toggling block:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={loading}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md ${className}`}
      title={isBlocked ? 'Unblock user' : 'Block user'}
    >
      <Ban className="h-4 w-4 mr-2" />
      {isBlocked ? 'Unblock' : 'Block'}
    </button>
  );
}