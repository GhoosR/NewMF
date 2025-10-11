import { supabase } from '../supabase';

export async function checkUsernameAvailability(username: string) {
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;
  return !existingUser;
}

export async function signUp(
  email: string, 
  password: string, 
  username: string,
  userType: 'member' | 'professional' = 'member'
) {
  // First check username availability
  const isUsernameAvailable = await checkUsernameAvailability(username);
  if (!isUsernameAvailable) {
    throw new Error('This username is already taken. Please choose another one.');
  }

  // Create auth user with auto-confirm enabled
  const { data: { user, session }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        isNewUser: true
      },
      emailRedirectTo: `${window.location.origin}`,
    }
  });

  if (signUpError) {
    // Handle specific error cases
    if (signUpError.message.includes('Password')) {
      throw new Error('Password must be at least 6 characters long');
    }
    if (signUpError.message.includes('email')) {
      throw new Error('Please enter a valid email address');
    }
    throw signUpError;
  }

  if (!user) throw new Error('Signup failed. Please try again.');

  try {
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        username,
        user_type: userType,
        subscription_status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);

    if (profileError) {
      // If profile creation fails, clean up the auth user
      await supabase.auth.signOut();
      throw profileError;
    }

    // Send welcome email
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't throw error here - we don't want to fail signup if email fails
    }
    return { user, session };
  } catch (error) {
    // Clean up auth user if profile creation fails
    await supabase.auth.signOut();
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Handle specific error cases
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password');
    }
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Please confirm your email address before signing in');
    }
    throw error;
  }
}

export async function isProfessional(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Use the new unified subscription system
    const { isProfessional } = await import('../subscription');
    return await isProfessional(user.id);
  } catch (error) {
    console.error('Error checking professional status:', error);
    return false;
  }
}