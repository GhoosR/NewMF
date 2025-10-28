import { useEffect, useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sessionPersistence } from '../lib/sessionPersistence';
import { initializeSessionMonitoring, cleanupSessionMonitoring } from '../lib/supabase';
import { webViewInfo, applyIOSWebViewOptimizations } from '../lib/webviewDetection';
import { appLifecycleManager } from '../lib/appLifecycleManager';

interface SessionRestorationState {
  isRestoring: boolean;
  isIOSWebView: boolean;
  sessionRestored: boolean;
  error: string | null;
  isAppRestart: boolean;
  appLevelRestoration: boolean;
}

/**
 * Hook for handling session restoration in iOS WebViews
 * This hook provides automatic session restoration and monitoring
 */
export function useSessionRestoration() {
  const [state, setState] = useState<SessionRestorationState>({
    isRestoring: false,
    isIOSWebView: false,
    sessionRestored: false,
    error: null,
    isAppRestart: false,
    appLevelRestoration: false
  });

  // Detect if we're in an iOS WebView
  const detectIOSWebView = useCallback(() => {
    return webViewInfo.isIOSWebView;
  }, []);

  // Attempt to restore session from backup storage
  const restoreSession = useCallback(async () => {
    setState(prev => ({ ...prev, isRestoring: true, error: null }));

    try {
      // Get session from our enhanced persistence
      const sessionData = await sessionPersistence.getSession();
      
      if (sessionData) {
        // Try to restore the session with Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token
        });

        if (error) {
          console.warn('Session restoration failed:', error);
          setState(prev => ({ 
            ...prev, 
            isRestoring: false, 
            error: 'Session restoration failed' 
          }));
          return false;
        }

        if (data.session) {
          console.log('Session successfully restored from backup storage');
          setState(prev => ({ 
            ...prev, 
            isRestoring: false, 
            sessionRestored: true 
          }));
          return true;
        }
      }

      setState(prev => ({ ...prev, isRestoring: false }));
      return false;
    } catch (error) {
      console.error('Session restoration error:', error);
      setState(prev => ({ 
        ...prev, 
        isRestoring: false, 
        error: 'Session restoration error' 
      }));
      return false;
    }
  }, []);

  // Monitor for session loss and attempt restoration
  const monitorSessionLoss = useCallback(() => {
    let lastSession: string | null = null;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentSession = session ? session.access_token : null;

        // If we had a session but now we don't, attempt restoration
        if (lastSession && !currentSession) {
          console.warn('Session lost, attempting restoration...');
          await restoreSession();
        }

        lastSession = currentSession;
      } catch (error) {
        console.warn('Session monitoring error:', error);
      }
    };

    // Check session every 10 seconds
    const interval = setInterval(checkSession, 10000);

    return () => clearInterval(interval);
  }, [restoreSession]);

  // Handle page visibility changes for session restoration
  const handleVisibilityChange = useCallback(async () => {
    if (!document.hidden && state.isIOSWebView) {
      // Check if session is still valid when page becomes visible
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Page became visible but no session, attempting restoration...');
        await restoreSession();
      }
    }
  }, [restoreSession, state.isIOSWebView]);

  // Handle page focus for session restoration
  const handleFocus = useCallback(async () => {
    if (state.isIOSWebView) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('Page focused but no session, attempting restoration...');
        await restoreSession();
      }
    }
  }, [restoreSession, state.isIOSWebView]);

  // Handle beforeunload to ensure session is backed up
  const handleBeforeUnload = useCallback(async () => {
    if (state.isIOSWebView) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await sessionPersistence.storeSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at || 0,
          user_id: session.user?.id || '',
          email: session.user?.email
        });
      }
    }
  }, [state.isIOSWebView]);

  // Initialize session restoration
  useEffect(() => {
    const isIOSWebView = detectIOSWebView();
    const appState = appLifecycleManager.getAppState();
    
    setState(prev => ({ 
      ...prev, 
      isIOSWebView,
      isAppRestart: appState.isAppRestart 
    }));

    if (webViewInfo.isWebView) {
      // Apply iOS WebView optimizations
      const optimizations = applyIOSWebViewOptimizations();
      
      // Initialize session monitoring
      initializeSessionMonitoring();

      // Set up event listeners
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleFocus);
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Start session monitoring with optimized intervals
      const cleanupMonitoring = monitorSessionLoss();

      // Handle app-level session restoration
      const handleAppRestart = async () => {
        if (appState.isAppRestart) {
          setState(prev => ({ ...prev, appLevelRestoration: true, isRestoring: true }));
          
          try {
            const restored = await appLifecycleManager.initializeSessionRestoration();
            
            setState(prev => ({ 
              ...prev, 
              appLevelRestoration: false,
              isRestoring: false,
              sessionRestored: restored
            }));
          } catch (error) {
            setState(prev => ({ 
              ...prev, 
              appLevelRestoration: false,
              isRestoring: false,
              error: 'App-level restoration failed'
            }));
          }
        } else {
          // Regular session restoration for tab-level issues
          restoreSession();
        }
      };

      handleAppRestart();

      console.log(`Session restoration initialized for ${webViewInfo.platform} WebView (App restart: ${appState.isAppRestart})`);

      return () => {
        cleanupSessionMonitoring();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        cleanupMonitoring();
      };
    }
  }, [detectIOSWebView, handleVisibilityChange, handleFocus, handleBeforeUnload, monitorSessionLoss, restoreSession]);

  // Listen for auth state changes to update restoration status
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && state.isIOSWebView) {
        setState(prev => ({ ...prev, sessionRestored: false }));
        // Mark session as active in app lifecycle manager
        appLifecycleManager.markSessionActive();
      } else if (event === 'SIGNED_OUT' && state.isIOSWebView) {
        // Don't immediately attempt restoration on sign out
        setState(prev => ({ ...prev, sessionRestored: false }));
        // Mark session as ended in app lifecycle manager
        appLifecycleManager.markSessionEnded();
      }
    });

    return () => subscription.unsubscribe();
  }, [state.isIOSWebView]);

  return {
    ...state,
    restoreSession,
    isRestoring: state.isRestoring,
    isIOSWebView: state.isIOSWebView,
    sessionRestored: state.sessionRestored,
    error: state.error,
    isAppRestart: state.isAppRestart,
    appLevelRestoration: state.appLevelRestoration
  };
}
