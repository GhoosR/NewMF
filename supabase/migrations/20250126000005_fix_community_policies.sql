/*
  # Fix community RLS policies to prevent infinite recursion

  The previous migration created policies that conflict with existing ones.
  This migration removes the problematic policies and ensures proper RLS.
*/

-- Drop the problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Community about information is readable by members" ON communities;
DROP POLICY IF EXISTS "Community admins can update about information" ON communities;

-- The existing RLS policies should handle the access control properly
-- No need to add additional policies as the communities table already has
-- proper RLS policies in place from previous migrations


