# iOS WebView Session Persistence Fix

This document explains the solution implemented to fix session logout issues in iOS WebView apps when closing tabs.

## Problem

iOS WebViews were clearing localStorage aggressively when **closing and reopening the entire app**, causing users to be logged out unexpectedly. This didn't happen on Android WebViews.

### Two Scenarios:
1. **Tab-level**: Closing tabs within the app (original issue)
2. **App-level**: Closing the entire app and reopening it (main issue)

## Root Cause

- **iOS WebViews** are more aggressive about clearing localStorage for memory management
- **App Termination**: When the entire iOS WebView app is closed, the WebView process is completely terminated
- **Storage Clearing**: App termination can clear localStorage, sessionStorage, and some cookies
- **iOS has stricter privacy policies** around persistent web storage in web contexts
- **Supabase relies on localStorage** internally for storing authentication tokens
- **Android WebViews** maintain storage better across app restarts

## Solution Overview

The solution implements a comprehensive session persistence system with multiple fallback mechanisms:

### 1. Enhanced Session Persistence (`src/lib/sessionPersistence.ts`)

- **Multiple Storage Adapters**: localStorage, sessionStorage, cookies, and IndexedDB
- **Automatic Fallback**: If one storage method fails, automatically tries others
- **iOS-Specific Backup**: Creates backup copies in multiple storage locations for iOS WebViews
- **Session Validation**: Ensures stored session data is valid and not expired

### 2. Enhanced Supabase Client (`src/lib/supabase.ts`)

- **Custom Storage Layer**: Overrides Supabase's default localStorage usage
- **Dual Storage**: Stores session data in both localStorage and backup locations
- **Automatic Restoration**: Retrieves session from backup storage when primary storage is cleared
- **Session Monitoring**: Continuously monitors storage availability and migrates data if needed

### 3. WebView Detection (`src/lib/webviewDetection.ts`)

- **Platform Detection**: Identifies iOS WebView, Android WebView, and desktop environments
- **Storage Testing**: Tests which storage mechanisms are available
- **iOS Optimizations**: Applies iOS-specific performance and storage optimizations
- **Memory Management**: Handles iOS WebView memory warnings and cleanup

### 4. Session Restoration Hook (`src/hooks/useSessionRestoration.ts`)

- **Automatic Restoration**: Attempts to restore sessions when detected as lost
- **Event Monitoring**: Listens for page visibility changes, focus events, and beforeunload
- **Session Monitoring**: Continuously checks for session loss and triggers restoration
- **User Feedback**: Provides visual feedback during restoration attempts

### 5. App Lifecycle Manager (`src/lib/appLifecycleManager.ts`)

- **App Restart Detection**: Detects when the app has been closed and reopened
- **Persistent State Tracking**: Uses cookies to track app lifecycle across restarts
- **Storage Integrity Monitoring**: Continuously monitors if storage has been cleared
- **App-Level Restoration**: Handles session restoration specifically for app restarts

### 6. App Integration (`src/App.tsx`)

- **Seamless Integration**: Automatically initializes session restoration for WebViews
- **Enhanced Loading States**: Shows appropriate loading messages for iOS WebView users
- **App Restart Feedback**: Provides specific messaging for app-level restoration
- **Error Handling**: Displays helpful error messages when restoration fails

## Key Features

### Multi-Layer Storage Strategy
```typescript
// For WebView apps (app-level persistence):
1. cookies (most persistent across app restarts)
2. localStorage (primary for tab-level)
3. sessionStorage (backup)
4. IndexedDB (fallback)

// For regular browsers:
1. localStorage (primary)
2. sessionStorage (backup)
3. cookies (persistent backup)
4. IndexedDB (fallback)
```

### iOS-Specific Optimizations
- Shorter monitoring intervals (15s vs 30s)
- Aggressive backup strategies
- Memory warning handling
- Touch and performance optimizations

### Automatic Session Monitoring
- Monitors storage every 15-30 seconds
- Checks on page visibility changes
- Validates session on page focus
- Triggers restoration when session is lost
- **App-Level Monitoring**: Detects app restarts and handles restoration
- **Storage Integrity**: Continuously checks if storage has been cleared

## Usage

The solution is automatically activated when the app detects it's running in a WebView environment. No additional configuration is required.

### For Developers

The session restoration is handled automatically, but you can access the status:

```typescript
import { useSessionRestoration } from './hooks/useSessionRestoration';

function MyComponent() {
  const { 
    isRestoring, 
    isIOSWebView, 
    sessionRestored, 
    error,
    isAppRestart,
    appLevelRestoration
  } = useSessionRestoration();
  
  // Handle restoration status as needed
  if (isAppRestart) {
    // Handle app restart scenario
  }
}
```

### WebView Detection

```typescript
import { webViewInfo } from './lib/webviewDetection';

console.log('Platform:', webViewInfo.platform);
console.log('Is WebView:', webViewInfo.isWebView);
console.log('Is iOS WebView:', webViewInfo.isIOSWebView);
console.log('Storage Type:', webViewInfo.storageType);
```

## Testing

To test the solution:

1. **App-Level Testing (Main Scenario)**:
   - Open the app in an iOS WebView
   - Log in and verify session persistence
   - **Close the entire app** (not just tabs)
   - **Reopen the app** from the home screen
   - Check that session is automatically restored

2. **Tab-Level Testing**:
   - Open the app in an iOS WebView
   - Log in and verify session persistence
   - Close and reopen tabs within the app
   - Check that session is automatically restored

3. **Storage Testing**:
   - Test with localStorage disabled
   - Test with different storage quotas
   - Test with memory pressure scenarios

4. **Cross-Platform Testing**:
   - Verify Android WebView still works normally
   - Verify desktop browsers work normally
   - Test different iOS versions

## Browser Compatibility

- ✅ iOS Safari WebView
- ✅ iOS Chrome WebView
- ✅ Android WebView
- ✅ Desktop browsers
- ✅ PWA environments

## Performance Impact

- **Minimal overhead** for non-WebView environments
- **Optimized intervals** for iOS WebViews (15s vs 30s)
- **Efficient storage** with automatic cleanup
- **Memory conscious** with garbage collection triggers

## Future Enhancements

Potential improvements that could be added:

1. **Native App Integration**: Store backup tokens in native app storage
2. **Biometric Authentication**: Use device biometrics for session restoration
3. **Offline Support**: Cache critical data for offline access
4. **Analytics**: Track session restoration success rates
5. **User Preferences**: Allow users to configure session persistence settings

## Troubleshooting

### Common Issues

1. **Session not restoring**: Check console for storage errors
2. **Performance issues**: Verify iOS optimizations are applied
3. **Storage quota exceeded**: Check IndexedDB fallback is working

### Debug Mode

Enable debug logging by setting:
```typescript
localStorage.setItem('mf_debug_session', 'true');
```

This will log detailed information about session persistence operations.

## Conclusion

This solution provides a robust, multi-layered approach to session persistence that specifically addresses **both tab-level and app-level** iOS WebView limitations while maintaining compatibility across all platforms. 

### Key Benefits:
- **Solves App Restart Issue**: Users stay logged in when closing and reopening the entire app
- **Handles Tab Issues**: Also fixes session loss when closing tabs within the app
- **Automatic Detection**: Distinguishes between fresh app launches and app restarts
- **Persistent Storage**: Uses cookies as primary storage for app-level persistence
- **Seamless Experience**: Users don't need to re-authenticate after app restarts

The automatic fallback mechanisms ensure users stay logged in even when primary storage is cleared, providing a smooth experience across all iOS WebView scenarios.
