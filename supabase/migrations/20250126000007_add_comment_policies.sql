/*
  # Add RLS policies for comment tables to allow admin deletion

  This migration adds proper RLS policies for:
  - community_post_comments
  - timeline_post_comments

  Policies allow:
  - Users to delete their own comments
  - Admins to delete any comments
  - Users to view comments on posts they can see
  - Users to create comments on posts they can see
*/

-- Enable RLS on comment tables
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view community post comments" ON community_post_comments;
DROP POLICY IF EXISTS "Users can create community post comments" ON community_post_comments;
DROP POLICY IF EXISTS "Users can update their own community post comments" ON community_post_comments;
DROP POLICY IF EXISTS "Users can delete their own community post comments" ON community_post_comments;
DROP POLICY IF EXISTS "Admins can delete any community post comments" ON community_post_comments;

DROP POLICY IF EXISTS "Users can view timeline post comments" ON timeline_post_comments;
DROP POLICY IF EXISTS "Users can create timeline post comments" ON timeline_post_comments;
DROP POLICY IF EXISTS "Users can update their own timeline post comments" ON timeline_post_comments;
DROP POLICY IF EXISTS "Users can delete their own timeline post comments" ON timeline_post_comments;
DROP POLICY IF EXISTS "Admins can delete any timeline post comments" ON timeline_post_comments;

-- Community post comments policies
CREATE POLICY "Users can view community post comments"
ON community_post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.id = community_post_comments.post_id
    AND (
      -- User is member of the community
      EXISTS (
        SELECT 1 FROM community_members
        WHERE community_members.community_id = community_posts.community_id
        AND community_members.user_id = auth.uid()
      )
      OR
      -- Community is public
      EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_posts.community_id
        AND communities.type = 'public'
      )
    )
  )
);

CREATE POLICY "Users can create community post comments"
ON community_post_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.id = community_post_comments.post_id
    AND (
      -- User is member of the community
      EXISTS (
        SELECT 1 FROM community_members
        WHERE community_members.community_id = community_posts.community_id
        AND community_members.user_id = auth.uid()
      )
      OR
      -- Community is public
      EXISTS (
        SELECT 1 FROM communities
        WHERE communities.id = community_posts.community_id
        AND communities.type = 'public'
      )
    )
  )
);

CREATE POLICY "Users can update their own community post comments"
ON community_post_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own community post comments"
ON community_post_comments FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any community post comments"
ON community_post_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);

-- Timeline post comments policies
CREATE POLICY "Users can view timeline post comments"
ON timeline_post_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM timeline_posts
    WHERE timeline_posts.id = timeline_post_comments.post_id
  )
);

CREATE POLICY "Users can create timeline post comments"
ON timeline_post_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM timeline_posts
    WHERE timeline_posts.id = timeline_post_comments.post_id
  )
);

CREATE POLICY "Users can update their own timeline post comments"
ON timeline_post_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own timeline post comments"
ON timeline_post_comments FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any timeline post comments"
ON timeline_post_comments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);











