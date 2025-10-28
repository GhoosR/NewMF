/**
 * Session Persistence Utility for iOS WebView Compatibility
 * 
 * This utility provides multiple fallback mechanisms to ensure session
 * persistence works reliably across different WebView implementations,
 * especially iOS WebViews which may clear localStorage aggressively.
 */

import { webViewInfo, shouldUseEnhancedPersistence } from './webviewDetection';

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  email?: string;
}

interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): boolean;
  clear(): boolean;
}

class LocalStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

class SessionStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): boolean {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
}

class CookieStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === key) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  set(key: string, value: string): boolean {
    try {
      // Set cookie with long expiration (1 year) and secure flags
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      
      document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax; Secure`;
      return true;
    } catch {
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    // Clear all our session cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('mf_session_')) {
        this.remove(name);
      }
    }
    return true;
  }
}

class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'MindfulFamilySession';
  private version = 1;
  private storeName = 'sessions';

  private async getDB(): Promise<IDBDatabase | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      if (!db) return null;

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(value, key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) return false;

      return new Promise((resolve) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }
}

export class SessionPersistence {
  private adapters: StorageAdapter[];
  private sessionKey = 'mf_session_data';
  private backupKey = 'mf_session_backup';

  constructor() {
    // Initialize adapters in order of preference
    // For app-level persistence, prioritize cookies over localStorage
    if (webViewInfo.isWebView) {
      this.adapters = [
        new CookieStorageAdapter(),      // Most persistent across app restarts
        new LocalStorageAdapter(),
        new SessionStorageAdapter(),
        new IndexedDBAdapter()
      ];
    } else {
      this.adapters = [
        new LocalStorageAdapter(),
        new SessionStorageAdapter(),
        new CookieStorageAdapter(),
        new IndexedDBAdapter()
      ];
    }
  }

  /**
   * Detect if we're running in an iOS WebView
   */
  private isIOSWebView(): boolean {
    return webViewInfo.isIOSWebView;
  }

  /**
   * Store session data using multiple fallback mechanisms
   */
  async storeSession(sessionData: SessionData): Promise<boolean> {
    const dataString = JSON.stringify(sessionData);
    let stored = false;

    // Try each adapter in order
    for (const adapter of this.adapters) {
      try {
        const success = await adapter.set(this.sessionKey, dataString);
        if (success) {
          stored = true;
          
          // For iOS WebViews, also store in backup locations
          if (this.isIOSWebView()) {
            await adapter.set(this.backupKey, dataString);
          }
        }
      } catch (error) {
        console.warn('Storage adapter failed:', error);
      }
    }

    return stored;
  }

  /**
   * Retrieve session data from multiple sources
   */
  async getSession(): Promise<SessionData | null> {
    // Try primary storage first
    for (const adapter of this.adapters) {
      try {
        const data = await adapter.get(this.sessionKey);
        if (data) {
          const sessionData = JSON.parse(data);
          if (this.isValidSession(sessionData)) {
            return sessionData;
          }
        }
      } catch (error) {
        console.warn('Failed to read from storage adapter:', error);
      }
    }

    // For iOS WebViews, try backup storage
    if (this.isIOSWebView()) {
      for (const adapter of this.adapters) {
        try {
          const data = await adapter.get(this.backupKey);
          if (data) {
            const sessionData = JSON.parse(data);
            if (this.isValidSession(sessionData)) {
              // Restore to primary storage
              await this.storeSession(sessionData);
              return sessionData;
            }
          }
        } catch (error) {
          console.warn('Failed to read from backup storage:', error);
        }
      }
    }

    return null;
  }

  /**
   * Clear session data from all storage mechanisms
   */
  async clearSession(): Promise<void> {
    for (const adapter of this.adapters) {
      try {
        await adapter.remove(this.sessionKey);
        await adapter.remove(this.backupKey);
      } catch (error) {
        console.warn('Failed to clear storage:', error);
      }
    }
  }

  /**
   * Validate session data
   */
  private isValidSession(sessionData: any): boolean {
    return (
      sessionData &&
      typeof sessionData === 'object' &&
      sessionData.access_token &&
      sessionData.refresh_token &&
      sessionData.expires_at &&
      sessionData.user_id &&
      Date.now() < sessionData.expires_at * 1000
    );
  }

  /**
   * Monitor storage availability and migrate data if needed
   */
  async monitorStorage(): Promise<void> {
    // Check if primary storage is still available
    const primaryAdapter = this.adapters[0];
    const testKey = 'mf_storage_test';
    
    try {
      primaryAdapter.set(testKey, 'test');
      const retrieved = primaryAdapter.get(testKey);
      primaryAdapter.remove(testKey);
      
      if (retrieved !== 'test') {
        console.warn('Primary storage may have been cleared, attempting migration...');
        await this.migrateFromBackup();
      }
    } catch (error) {
      console.warn('Primary storage unavailable, attempting migration...');
      await this.migrateFromBackup();
    }
  }

  /**
   * Migrate session data from backup storage
   */
  private async migrateFromBackup(): Promise<void> {
    for (let i = 1; i < this.adapters.length; i++) {
      const backupAdapter = this.adapters[i];
      try {
        const backupData = await backupAdapter.get(this.backupKey);
        if (backupData) {
          const sessionData = JSON.parse(backupData);
          if (this.isValidSession(sessionData)) {
            // Try to restore to primary storage
            const restored = await this.storeSession(sessionData);
            if (restored) {
              console.log('Session data successfully migrated from backup storage');
              return;
            }
          }
        }
      } catch (error) {
        console.warn('Migration attempt failed:', error);
      }
    }
  }
}

// Export singleton instance
export const sessionPersistence = new SessionPersistence();
