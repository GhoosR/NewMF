import { supabase } from './supabase';

let activityInterval: NodeJS.Timeout | null = null;
let isTracking = false;

/**
 * Start tracking user activity
 */
export function startActivityTracking() {
  if (isTracking) return;
  
  isTracking = true;
  
  // Update activity immediately
  updateUserActivity();
  
  // Update activity every 2 minutes
  activityInterval = setInterval(() => {
    updateUserActivity();
  }, 2 * 60 * 1000);
  
  // Update activity on user interaction
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const handleActivity = throttle(() => {
    updateUserActivity();
  }, 30000); // Throttle to once every 30 seconds
  
  events.forEach(event => {
    document.addEventListener(event, handleActivity, true);
  });
  
  // Update activity when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateUserActivity();
    }
  });
  
  // Update activity before page unload
  window.addEventListener('beforeunload', () => {
    updateUserActivity();
  });
}

/**
 * Stop tracking user activity
 */
export function stopActivityTracking() {
  if (!isTracking) return;
  
  isTracking = false;
  
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
  
  // Mark user as offline
  markUserOffline();
}

/**
 * Update user's last activity timestamp
 */
async function updateUserActivity() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_activity')
      .upsert({
        user_id: user.id,
        last_seen: new Date().toISOString(),
        is_online: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user activity:', error);
    }
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * Mark user as offline
 */
async function markUserOffline() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase
      .from('user_activity')
      .update({
        is_online: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error marking user offline:', error);
    }
  } catch (error) {
    console.error('Error marking user offline:', error);
  }
}

/**
 * Get online status for a user
 */
export async function getUserOnlineStatus(userId: string): Promise<boolean> {
  try {
    // Default to offline
    if (!userId) return false;

    const { data, error } = await supabase
      .from('user_activity')
      .select('is_online, last_seen')
      .eq('user_id', userId)
      .maybeSingle();
    
    // If no activity record exists, user is offline
    if (error || !data || !data.last_seen) return false;
    
    // Consider user online if they were active in the last 3 minutes AND marked as online
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    const lastSeen = new Date(data.last_seen);
    
    return data.is_online === true && lastSeen > threeMinutesAgo;
  } catch (error) {
    console.error('Error getting user online status:', error);
    return false;
  }
}

/**
 * Get online status for multiple users
 */
export async function getMultipleUsersOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
  try {
    if (userIds.length === 0) return {};
    
    const { data, error } = await supabase
      .from('user_activity')
      .select('user_id, is_online, last_seen')
      .in('user_id', userIds);
    
    if (error) throw error;
    
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    // Initialize all users as offline
    const result = userIds.reduce((acc, userId) => {
      acc[userId] = false;
      return acc;
    }, {} as Record<string, boolean>);

    // Only mark users as online if they have recent activity
    (data || []).forEach(activity => {
      if (activity.last_seen) {
        const lastSeen = new Date(activity.last_seen);
        result[activity.user_id] = activity.is_online === true && lastSeen > threeMinutesAgo;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting multiple users online status:', error);
    // Return all users as offline on error
    return userIds.reduce((acc, userId) => {
      acc[userId] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}

/**
 * Get users with their profile data and online status in a single optimized call
 */
export async function getUsersWithOnlineStatus(userIds: string[]): Promise<Record<string, {
  id: string;
  username: string;
  avatar_url?: string;
  isOnline: boolean;
}>> {
  try {
    if (userIds.length === 0) return {};

    // Fetch user profiles and online statuses in parallel
    const [usersResult, onlineStatuses] = await Promise.all([
      supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds),
      getMultipleUsersOnlineStatus(userIds)
    ]);

    if (usersResult.error) throw usersResult.error;

    // Combine user data with online status
    const result: Record<string, {
      id: string;
      username: string;
      avatar_url?: string;
      isOnline: boolean;
    }> = {};

    (usersResult.data || []).forEach(user => {
      result[user.id] = {
        id: user.id,
        username: user.username || 'Unknown User',
        avatar_url: user.avatar_url,
        isOnline: onlineStatuses[user.id] || false
      };
    });

    return result;
  } catch (error) {
    console.error('Error getting users with online status:', error);
    // Return empty object on error
    return {};
  }
}

/**
 * Throttle function to limit how often a function can be called
 */
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}