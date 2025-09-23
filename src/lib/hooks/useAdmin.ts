import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        setIsAdmin(!!data?.is_admin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);

  return { isAdmin, loading };
}