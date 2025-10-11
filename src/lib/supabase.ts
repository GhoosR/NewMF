import { createClient } from '@supabase/supabase-js';
import { sessionPersistence } from './sessionPersistence';
import { webViewInfo, applyIOSWebViewOptimizations } from './webviewDetection';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Enhanced Supabase client with iOS WebView compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Custom storage for iOS WebView compatibility
    storage: {
      getItem: async (key: string) => {
        try {
          // First try our enhanced persistence layer
          const sessionData = await sessionPersistence.getSession();
          if (sessionData && key === 'sb-auth-token') {
            return JSON.stringify({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token,
              expires_at: sessionData.expires_at,
              token_type: 'bearer',
              user: {
                id: sessionData.user_id,
                email: sessionData.email
              }
            });
          }
          
          // Fallback to localStorage
          return localStorage.getItem(key);
        } catch (error) {
          console.warn('Storage getItem error:', error);
          return localStorage.getItem(key);
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          // Store in localStorage first
          localStorage.setItem(key, value);
          
          // If it's session data, also store in our enhanced persistence
          if (key === 'sb-auth-token' && value) {
            try {
              const sessionData = JSON.parse(value);
              if (sessionData.access_token && sessionData.refresh_token) {
                await sessionPersistence.storeSession({
                  access_token: sessionData.access_token,
                  refresh_token: sessionData.refresh_token,
                  expires_at: sessionData.expires_at,
                  user_id: sessionData.user?.id,
                  email: sessionData.user?.email
                });
              }
            } catch (parseError) {
              console.warn('Failed to parse session data:', parseError);
            }
          }
        } catch (error) {
          console.warn('Storage setItem error:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
          if (key === 'sb-auth-token') {
            await sessionPersistence.clearSession();
          }
        } catch (error) {
          console.warn('Storage removeItem error:', error);
        }
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'mindful-family-web'
    }
  }
});

// Initialize session monitoring for iOS WebViews
let sessionMonitorInterval: NodeJS.Timeout | null = null;

export const initializeSessionMonitoring = () => {
  // Apply iOS WebView optimizations if needed
  const iosOptimizations = applyIOSWebViewOptimizations();
  
  if (webViewInfo.isWebView) {
    // Use optimized intervals for iOS WebView
    const monitoringInterval = (iosOptimizations as any).monitoringInterval || 30000;
    
    // Monitor storage at optimized intervals
    sessionMonitorInterval = setInterval(async () => {
      await sessionPersistence.monitorStorage();
    }, monitoringInterval);

    // Also monitor on page visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) {
        await sessionPersistence.monitorStorage();
      }
    });

    // Monitor on page focus
    window.addEventListener('focus', async () => {
      await sessionPersistence.monitorStorage();
    });

    console.log(`Session monitoring initialized for ${webViewInfo.platform} WebView`);
  }
};

export const cleanupSessionMonitoring = () => {
  if (sessionMonitorInterval) {
    clearInterval(sessionMonitorInterval);
    sessionMonitorInterval = null;
  }
};