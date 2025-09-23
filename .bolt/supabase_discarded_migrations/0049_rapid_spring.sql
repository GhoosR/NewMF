-- Drop all existing policies first
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view community members" ON community_members;
  DROP POLICY IF EXISTS "Owners and admins can manage members" ON community_members;
  DROP POLICY IF EXISTS "Public read access for community members" ON community_members;
  DROP POLICY IF EXISTS "Members can join public communities" ON community_members;
  DROP POLICY IF EXISTS "Owners can manage members" ON community_members;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new simplified policies with unique names
CREATE POLICY "community_members_public_read"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "community_members_public_join"
  ON community_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_id
      AND communities.type = 'public'
    )
    AND auth.uid() = user_id
    AND role = 'member'
  );

CREATE POLICY "community_members_owner_manage"
  ON community_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_id
      AND communities.owner_id = auth.uid()
    )
  );