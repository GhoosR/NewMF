/**
 * App Lifecycle Manager for iOS WebView Apps
 * 
 * Handles app termination and restart scenarios where the entire WebView
 * process is killed and restarted, potentially clearing all storage.
 */

import { sessionPersistence } from './sessionPersistence';
import { webViewInfo } from './webviewDetection';

interface AppLifecycleState {
  isAppRestart: boolean;
  lastSessionTime: number;
  appStartTime: number;
  sessionWasActive: boolean;
}

export class AppLifecycleManager {
  private static instance: AppLifecycleManager;
  private appState: AppLifecycleState;
  private sessionKey = 'mf_app_lifecycle';
  private lastActiveKey = 'mf_last_active_session';

  private constructor() {
    this.appState = {
      isAppRestart: false,
      lastSessionTime: 0,
      appStartTime: Date.now(),
      sessionWasActive: false
    };
    
    this.initialize();
  }

  static getInstance(): AppLifecycleManager {
    if (!AppLifecycleManager.instance) {
      AppLifecycleManager.instance = new AppLifecycleManager();
    }
    return AppLifecycleManager.instance;
  }

  private initialize() {
    if (!webViewInfo.isWebView) {
      return; // Only needed for WebView apps
    }

    this.detectAppRestart();
    this.setupAppLifecycleHandlers();
    this.setupStorageMonitoring();
  }

  /**
   * Detect if this is an app restart (vs first launch)
   */
  private detectAppRestart() {
    try {
      // Try to get app lifecycle data from cookies (most persistent)
      const lifecycleData = this.getFromCookie(this.sessionKey);
      const lastActive = this.getFromCookie(this.lastActiveKey);

      if (lifecycleData && lastActive) {
        const data = JSON.parse(lifecycleData);
        const lastActiveTime = parseInt(lastActive);
        
        // If we have previous data and the gap is reasonable (not a fresh install)
        if (data.appStartTime && lastActiveTime > 0) {
          const timeSinceLastActive = Date.now() - lastActiveTime;
          
          // If last active was within 24 hours, consider this a restart
          if (timeSinceLastActive < 24 * 60 * 60 * 1000) {
            this.appState.isAppRestart = true;
            this.appState.lastSessionTime = lastActiveTime;
            this.appState.sessionWasActive = true;
            
            console.log('App restart detected, attempting session restoration...');
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting app restart:', error);
    }

    console.log('Fresh app launch detected');
  }

  /**
   * Setup handlers for app lifecycle events
   */
  private setupAppLifecycleHandlers() {
    if (!webViewInfo.isWebView) return;

    // Save app state before app is terminated
    const saveAppState = async () => {
      await this.saveAppState();
    };

    // Handle app going to background (iOS)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        saveAppState();
      }
    });

    // Handle page unload (app termination)
    window.addEventListener('beforeunload', saveAppState);
    window.addEventListener('pagehide', saveAppState);

    // Handle iOS specific events
    window.addEventListener('blur', saveAppState);
    
    // Save state periodically while app is active
    setInterval(saveAppState, 30000); // Every 30 seconds
  }

  /**
   * Monitor storage and detect when it's been cleared
   */
  private setupStorageMonitoring() {
    if (!webViewInfo.isWebView) return;

    // Check storage integrity every 10 seconds
    setInterval(() => {
      this.checkStorageIntegrity();
    }, 10000);

    // Check on app focus
    window.addEventListener('focus', () => {
      setTimeout(() => this.checkStorageIntegrity(), 1000);
    });
  }

  /**
   * Check if storage has been cleared and needs restoration
   */
  private async checkStorageIntegrity() {
    try {
      // Check if our session data still exists
      const sessionData = await sessionPersistence.getSession();
      
      if (!sessionData && this.appState.sessionWasActive) {
        console.warn('Session data lost, attempting restoration...');
        await this.attemptSessionRestoration();
      }
    } catch (error) {
      console.warn('Storage integrity check failed:', error);
    }
  }

  /**
   * Attempt to restore session from persistent storage
   */
  private async attemptSessionRestoration(): Promise<boolean> {
    try {
      // Try to restore from our enhanced persistence layer
      const restored = await sessionPersistence.getSession();
      
      if (restored) {
        console.log('Session restored from backup storage');
        return true;
      }

      // If no backup session, check if we should show re-authentication
      if (this.appState.isAppRestart && this.appState.sessionWasActive) {
        console.log('App was restarted with active session, but no backup found');
        // Could trigger a re-authentication flow here
        return false;
      }

      return false;
    } catch (error) {
      console.error('Session restoration failed:', error);
      return false;
    }
  }

  /**
   * Save current app state to persistent storage
   */
  private async saveAppState() {
    try {
      const stateData = {
        appStartTime: this.appState.appStartTime,
        lastUpdate: Date.now(),
        sessionWasActive: this.appState.sessionWasActive
      };

      // Save to cookies (most persistent across app restarts)
      this.setCookie(this.sessionKey, JSON.stringify(stateData));
      
      // Update last active timestamp
      this.setCookie(this.lastActiveKey, Date.now().toString());

      // Also save to localStorage as backup
      try {
        localStorage.setItem(this.sessionKey, JSON.stringify(stateData));
        localStorage.setItem(this.lastActiveKey, Date.now().toString());
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }

    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  }

  /**
   * Mark that user has an active session
   */
  public markSessionActive() {
    this.appState.sessionWasActive = true;
    this.saveAppState();
  }

  /**
   * Mark that user session has ended
   */
  public markSessionEnded() {
    this.appState.sessionWasActive = false;
    this.setCookie(this.lastActiveKey, '0'); // Clear last active
  }

  /**
   * Get app lifecycle information
   */
  public getAppState(): AppLifecycleState {
    return { ...this.appState };
  }

  /**
   * Check if this appears to be an app restart
   */
  public isAppRestart(): boolean {
    return this.appState.isAppRestart;
  }

  /**
   * Cookie utilities (most persistent across app restarts)
   */
  private setCookie(name: string, value: string, days: number = 365) {
    try {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
    } catch (error) {
      console.warn('Failed to set cookie:', error);
    }
  }

  private getCookie(name: string): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
          return decodeURIComponent(cookieValue);
        }
      }
    } catch (error) {
      console.warn('Failed to get cookie:', error);
    }
    return null;
  }

  /**
   * Initialize session restoration on app startup
   */
  public async initializeSessionRestoration(): Promise<boolean> {
    if (!this.appState.isAppRestart) {
      return false; // Fresh launch, no restoration needed
    }

    console.log('Initializing session restoration for app restart...');
    
    // Wait a bit for the app to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Attempt restoration
    const restored = await this.attemptSessionRestoration();
    
    if (restored) {
      console.log('Session successfully restored after app restart');
      this.markSessionActive();
    } else {
      console.log('Session restoration failed, user may need to re-authenticate');
    }

    return restored;
  }
}

// Export singleton instance
export const appLifecycleManager = AppLifecycleManager.getInstance();
