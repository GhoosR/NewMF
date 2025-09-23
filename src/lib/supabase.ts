import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  fullKey: supabaseAnonKey // This will help us verify the key is correct
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Verify URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.endsWith('.supabase.co')) {
  throw new Error('Invalid Supabase URL format');
}

// Verify key format (should be a JWT)
if (!supabaseAnonKey.includes('.')) {
  throw new Error('Invalid Supabase anon key format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  logger: {
    level: 'error'
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.access_token) {
    // Set the JWT for the realtime client
    supabase.realtime.setAuth(session.access_token);
  } else if (event === 'SIGNED_OUT') {
    // Clear the JWT for the realtime client
    supabase.realtime.setAuth(null);
  }
});

// Set initial auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.access_token) {
    supabase.realtime.setAuth(session.access_token);
  }
});