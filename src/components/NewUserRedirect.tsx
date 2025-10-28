import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function NewUserRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkNewUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.user_metadata?.isNewUser) {
        if (session?.user?.user_metadata?.needsOnboarding) {
          // Redirect to onboarding page if user needs onboarding
          if (location.pathname !== '/onboarding') {
            navigate('/onboarding', { replace: true });
          }
        } else {
          // Only redirect if not already on profile page and onboarding is complete
          if (!location.pathname.includes('/profile/')) {
            // Get the user's username for the profile URL
            const { data: userProfile } = await supabase
              .from('users')
              .select('username')
              .eq('id', session.user.id)
              .single();

            if (userProfile?.username) {
              // Redirect to their profile page
              navigate(`/profile/${userProfile.username}`, { replace: true });
            }

            // Clear the isNewUser flag
            await supabase.auth.updateUser({
              data: { isNewUser: false }
            });
          }
        }
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.user_metadata?.isNewUser) {
          if (session?.user?.user_metadata?.needsOnboarding) {
            // Redirect to onboarding page if user needs onboarding
            if (location.pathname !== '/onboarding') {
              navigate('/onboarding', { replace: true });
            }
          } else {
            // Only redirect if not already on profile page and onboarding is complete
            if (!location.pathname.includes('/profile/')) {
              // Get the user's username for the profile URL
              const { data: userProfile } = await supabase
                .from('users')
                .select('username')
                .eq('id', session.user.id)
                .single();

              if (userProfile?.username) {
                // Redirect to their profile page
                navigate(`/profile/${userProfile.username}`, { replace: true });
              }

              // Clear the isNewUser flag
              await supabase.auth.updateUser({
                data: { isNewUser: false }
              });
            }
          }
        }
      }
    );

    checkNewUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location]);

  return null;
}










