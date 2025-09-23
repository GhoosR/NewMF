import { supabase } from './supabase';
import type { Profile } from './profile';

export async function ensureProfile(): Promise<Profile | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    // Try to get existing profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, username, full_name, avatar_url, banner_url, bio, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (profile) return profile;

    // Generate a unique username based on the email
    const email = user.email || '';
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;

    // Keep trying until we find a unique username
    while (true) {
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (!existingUser) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create new profile with unique username
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newProfile;
  } catch (error) {
    console.error('Error in ensureProfile:', error);
    return null;
  }
}