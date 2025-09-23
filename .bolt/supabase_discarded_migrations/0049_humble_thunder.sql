-- Drop existing tables if they exist
DROP TABLE IF EXISTS community_join_requests CASCADE;
DROP TABLE IF EXISTS community_post_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;

-- Create communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  owner_id UUID REFERENCES users(id) NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community members table
CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

-- Create community posts table
CREATE TABLE community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community post comments
CREATE TABLE community_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create join requests table for private communities
CREATE TABLE community_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (community_id, user_id)
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_join_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DO $$ 
BEGIN
  -- Communities policies
  DROP POLICY IF EXISTS "Anyone can view public communities" ON communities;
  DROP POLICY IF EXISTS "Users can create communities" ON communities;
  DROP POLICY IF EXISTS "Only owners and admins can update communities" ON communities;
  
  -- Members policies
  DROP POLICY IF EXISTS "Members can view other members" ON community_members;
  DROP POLICY IF EXISTS "Admins can manage members" ON community_members;
  
  -- Posts policies
  DROP POLICY IF EXISTS "Members can view posts" ON community_posts;
  DROP POLICY IF EXISTS "Members can create posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
  DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
  
  -- Comments policies
  DROP POLICY IF EXISTS "Members can view comments" ON community_post_comments;
  DROP POLICY IF EXISTS "Members can create comments" ON community_post_comments;
  DROP POLICY IF EXISTS "Users can update own comments" ON community_post_comments;
  DROP POLICY IF EXISTS "Users can delete own comments" ON community_post_comments;
  
  -- Join requests policies
  DROP POLICY IF EXISTS "Users can create join requests" ON community_join_requests;
  DROP POLICY IF EXISTS "Users can view own requests" ON community_join_requests;
  DROP POLICY IF EXISTS "Admins can view and manage requests" ON community_join_requests;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create RLS Policies

-- Communities
CREATE POLICY "Anyone can view public communities"
  ON communities FOR SELECT
  USING (type = 'public' OR EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = communities.id
    AND community_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners and admins can update communities"
  ON communities FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- Community Members
CREATE POLICY "Members can view other members"
  ON community_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM community_members AS cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage members"
  ON community_members FOR ALL
  USING (EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin')
  ));

-- Community Posts
CREATE POLICY "Members can view posts"
  ON community_posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_posts.community_id
    AND community_members.user_id = auth.uid()
  ));

CREATE POLICY "Members can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_posts.community_id
    AND community_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Members can view comments"
  ON community_post_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM community_posts
    JOIN community_members ON community_posts.community_id = community_members.community_id
    WHERE community_posts.id = community_post_comments.post_id
    AND community_members.user_id = auth.uid()
  ));

CREATE POLICY "Members can create comments"
  ON community_post_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM community_posts
    JOIN community_members ON community_posts.community_id = community_members.community_id
    WHERE community_posts.id = community_post_comments.post_id
    AND community_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own comments"
  ON community_post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON community_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Join Requests
CREATE POLICY "Users can create join requests"
  ON community_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests"
  ON community_join_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view and manage requests"
  ON community_join_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = community_join_requests.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin')
  ));