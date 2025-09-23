-- Drop all existing policies first
DO $$ 
BEGIN
  -- Drop community policies
  DROP POLICY IF EXISTS "Public read access for communities" ON communities;
  DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
  DROP POLICY IF EXISTS "Owners can update communities" ON communities;
  DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
  DROP POLICY IF EXISTS "Users can create communities" ON communities;
  DROP POLICY IF EXISTS "communities_read_access" ON communities;
  DROP POLICY IF EXISTS "communities_create_auth" ON communities;
  DROP POLICY IF EXISTS "communities_update_owner" ON communities;

  -- Drop community members policies
  DROP POLICY IF EXISTS "Public read access for community members" ON community_members;
  DROP POLICY IF EXISTS "Members can join public communities" ON community_members;
  DROP POLICY IF EXISTS "Owners can manage members" ON community_members;
  DROP POLICY IF EXISTS "Anyone can view members" ON community_members;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new community policies with unique names
CREATE POLICY "communities_public_view_v2"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "communities_auth_create_v2"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "communities_owner_update_v2"
  ON communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create new community members policies with unique names
CREATE POLICY "community_members_public_view_v2"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "community_members_public_join_v2"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_id
      AND type = 'public'
    )
  );

CREATE POLICY "community_members_owner_manage_v2"
  ON community_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_id
      AND owner_id = auth.uid()
    )
  );