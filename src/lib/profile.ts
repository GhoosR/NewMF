import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  banner_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  verified?: boolean;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, banner_url, bio, created_at, updated_at, verified')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            username: `user_${userId.slice(0, 8)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .maybeSingle();

        if (createError) throw createError;
        return newProfile;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  try {
    // Only allow updating specific fields
    const allowedUpdates = {
      email: updates.email,
      full_name: updates.full_name,
      avatar_url: updates.avatar_url,
      banner_url: updates.banner_url,
      bio: updates.bio,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const { error } = await supabase
      .from('users')
      .update(allowedUpdates)
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
}