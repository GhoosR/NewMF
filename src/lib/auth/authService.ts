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
  console.log('🔧 signUp function called with:', { email, username, userType });
  
  // First check username availability
  const isUsernameAvailable = await checkUsernameAvailability(username);
  console.log('✅ Username available:', isUsernameAvailable);
  if (!isUsernameAvailable) {
    throw new Error('This username is already taken. Please choose another one.');
  }

  // Create auth user with auto-confirm enabled
  console.log('📧 Creating auth user...');
  const { data: { user, session }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        isNewUser: true,
        needsOnboarding: true  // Add flag to prevent immediate redirect
      },
      emailRedirectTo: `${window.location.origin}`,
    }
  });

  console.log('🔍 Auth signup result:', { user: user?.id, session: !!session, error: signUpError });

  if (signUpError) {
    console.error('❌ Auth signup error:', signUpError);
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
  console.log('✅ Auth user created:', user.id);

  // Create user profile (or update if exists) - wait for it to complete
  console.log('👤 Creating user profile...');
  const { error: profileError } = await supabase
    .from('users')
    .upsert([{
      id: user.id,
      username,
      user_type: userType,
      subscription_status: 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

  if (profileError) {
    console.error('❌ Profile creation error:', profileError);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  } else {
    console.log('✅ User profile created successfully');
  }

  // Send welcome email - don't wait for it
  console.log('📧 Sending welcome email...');
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/welcome-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    }
  })
  .then(() => {
    console.log('✅ Welcome email sent');
  })
  .catch((emailError) => {
    console.error('Error sending welcome email:', emailError);
  });
  
  console.log('🎉 SignUp function completed successfully, returning:', { user: user.id, session: !!session });
  return { user, session };
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