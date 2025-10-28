-- Fix missing user profile for user ID: a6359639-466c-4149-b502-c08567b14d23
-- This script creates the missing user profile record

INSERT INTO public.users (
  id,
  username,
  user_type,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  'a6359639-466c-4149-b502-c08567b14d23',
  'temp_user_' || extract(epoch from now())::text, -- Temporary username
  'member',
  'inactive',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = now();

-- Verify the user was created
SELECT id, username, user_type, created_at FROM public.users WHERE id = 'a6359639-466c-4149-b502-c08567b14d23';



