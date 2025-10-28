/**
 * WebView Detection and iOS-specific utilities
 * 
 * This module provides utilities for detecting different WebView environments
 * and applying iOS-specific optimizations for better session persistence.
 */

export interface WebViewInfo {
  isWebView: boolean;
  isIOSWebView: boolean;
  isAndroidWebView: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  userAgent: string;
  isStandalone: boolean;
  hasStorage: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'cookies' | 'indexedDB' | 'none';
}

/**
 * Detect WebView environment and platform details
 */
export function detectWebViewEnvironment(): WebViewInfo {
  const userAgent = navigator.userAgent;
  const isStandalone = window.navigator.standalone === true;
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  // Detect Android
  const isAndroid = /Android/.test(userAgent);
  
  // Detect WebView (not standalone and not regular Safari)
  const isWebView = !isStandalone && (
    userAgent.includes('wv') || // Android WebView
    userAgent.includes('Version/') || // iOS WebView
    (!userAgent.includes('Safari') && (isIOS || isAndroid)) // Other WebView indicators
  );
  
  // Determine if it's an iOS WebView
  const isIOSWebView = isIOS && isWebView;
  
  // Determine if it's an Android WebView
  const isAndroidWebView = isAndroid && isWebView;
  
  // Determine platform
  let platform: WebViewInfo['platform'] = 'unknown';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (!isWebView) platform = 'desktop';
  
  // Test storage availability
  const storageType = testStorageAvailability();
  
  return {
    isWebView,
    isIOSWebView,
    isAndroidWebView,
    platform,
    userAgent,
    isStandalone,
    hasStorage: storageType !== 'none',
    storageType
  };
}

/**
 * Test which storage mechanisms are available
 */
function testStorageAvailability(): WebViewInfo['storageType'] {
  try {
    // Test localStorage
    const testKey = 'mf_storage_test';
    localStorage.setItem(testKey, 'test');
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === 'test') {
      return 'localStorage';
    }
  } catch (error) {
    console.warn('localStorage not available:', error);
  }
  
  try {
    // Test sessionStorage
    const testKey = 'mf_storage_test';
    sessionStorage.setItem(testKey, 'test');
    const retrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    
    if (retrieved === 'test') {
      return 'sessionStorage';
    }
  } catch (error) {
    console.warn('sessionStorage not available:', error);
  }
  
  // Cookies are always available
  return 'cookies';
}

/**
 * Get iOS-specific WebView optimizations
 */
export function getIOSWebViewOptimizations() {
  const webViewInfo = detectWebViewEnvironment();
  
  if (!webViewInfo.isIOSWebView) {
    return {};
  }
  
  return {
    // Prevent iOS Safari from zooming on form inputs
    preventZoom: () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      }
    },
    
    // Optimize for iOS WebView performance
    optimizePerformance: () => {
      // Disable smooth scrolling on iOS WebView for better performance
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Add iOS-specific CSS optimizations
      const style = document.createElement('style');
      style.textContent = `
        /* iOS WebView optimizations */
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
        }
        
        /* Prevent iOS bounce scrolling */
        body {
          position: fixed;
          overflow: hidden;
          width: 100%;
          height: 100%;
        }
        
        /* Optimize touch events */
        button, a, input, select, textarea {
          -webkit-appearance: none;
          touch-action: manipulation;
        }
      `;
      document.head.appendChild(style);
    },
    
    // Handle iOS WebView memory warnings
    handleMemoryWarning: () => {
      // Listen for memory warnings (if available)
      if ('memory' in performance) {
        const checkMemory = () => {
          const memInfo = (performance as any).memory;
          if (memInfo && memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.8) {
            console.warn('High memory usage detected in iOS WebView');
            // Trigger garbage collection if available
            if (window.gc) {
              window.gc();
            }
          }
        };
        
        setInterval(checkMemory, 30000); // Check every 30 seconds
      }
    },
    
    // Optimize session storage for iOS WebView
    optimizeSessionStorage: () => {
      // Use shorter intervals for session monitoring on iOS
      return {
        monitoringInterval: 15000, // 15 seconds instead of 30
        backupInterval: 10000,     // Backup every 10 seconds
        cleanupInterval: 30000     // Cleanup every 30 seconds
      };
    }
  };
}

/**
 * Apply iOS WebView optimizations automatically
 */
export function applyIOSWebViewOptimizations() {
  const webViewInfo = detectWebViewEnvironment();
  
  if (webViewInfo.isIOSWebView) {
    console.log('iOS WebView detected, applying optimizations...');
    
    const optimizations = getIOSWebViewOptimizations();
    
    // Apply viewport optimizations
    optimizations.preventZoom?.();
    
    // Apply performance optimizations
    optimizations.optimizePerformance?.();
    
    // Handle memory warnings
    optimizations.handleMemoryWarning?.();
    
    // Return optimized settings
    return optimizations.optimizeSessionStorage?.() || {};
  }
  
  return {};
}

/**
 * Check if we should use enhanced session persistence
 */
export function shouldUseEnhancedPersistence(): boolean {
  const webViewInfo = detectWebViewEnvironment();
  
  return webViewInfo.isWebView || webViewInfo.platform === 'ios' || webViewInfo.storageType === 'none';
}

// Export singleton instance for easy access
export const webViewInfo = detectWebViewEnvironment();
