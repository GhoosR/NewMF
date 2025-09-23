-- Drop all existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
  DROP POLICY IF EXISTS "Users can create communities" ON communities;
  DROP POLICY IF EXISTS "Only owners and admins can update communities" ON communities;
  DROP POLICY IF EXISTS "Public read access for communities" ON communities;
  DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
  DROP POLICY IF EXISTS "Owners can update communities" ON communities;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new policies with unique names
CREATE POLICY "communities_read_access"
  ON communities FOR SELECT
  USING (
    type = 'public' OR
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "communities_create_auth"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "communities_update_owner"
  ON communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_community_created ON communities;
DROP FUNCTION IF EXISTS public.handle_new_community();

-- Recreate function to automatically add owner as admin
CREATE OR REPLACE FUNCTION public.handle_new_community()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new community creation
CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_community();