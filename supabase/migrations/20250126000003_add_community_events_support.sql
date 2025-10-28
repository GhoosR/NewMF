/*
  # Add community events support

  1. Updates to events table:
    - Add community_id (uuid, foreign key to communities, nullable)
    - Add visibility (text, 'public' or 'private', default 'public')
    - Add pinned (boolean, default false) for community posts
    - Add pinned_at (timestamptz) for when post was pinned

  2. Updates to community_posts table:
    - Add pinned (boolean, default false)
    - Add pinned_at (timestamptz)

  3. Security:
    - Add RLS policies for community events
    - Add policies for pinning posts (admin only)
*/

-- Add new columns to events table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'community_id') THEN
        ALTER TABLE events ADD COLUMN community_id uuid REFERENCES communities(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'visibility') THEN
        ALTER TABLE events ADD COLUMN visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'pinned') THEN
        ALTER TABLE events ADD COLUMN pinned boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'pinned_at') THEN
        ALTER TABLE events ADD COLUMN pinned_at timestamptz;
    END IF;
END $$;

-- Add new columns to community_posts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'pinned') THEN
        ALTER TABLE community_posts ADD COLUMN pinned boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_posts' AND column_name = 'pinned_at') THEN
        ALTER TABLE community_posts ADD COLUMN pinned_at timestamptz;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_pinned ON events(pinned);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts(pinned);

-- Create RLS policies for community events
DROP POLICY IF EXISTS "Community events are readable by community members" ON events;
CREATE POLICY "Community events are readable by community members" ON events
  FOR SELECT USING (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = events.community_id
      AND community_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Community admins can create events in their communities" ON events;
CREATE POLICY "Community admins can create events in their communities" ON events
  FOR INSERT WITH CHECK (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = events.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Community admins can update events in their communities" ON events;
CREATE POLICY "Community admins can update events in their communities" ON events
  FOR UPDATE USING (
    community_id IS NULL OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = events.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- Create function to pin/unpin posts
CREATE OR REPLACE FUNCTION pin_community_post(post_id uuid, community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin of the community
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = pin_community_post.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only community admins can pin posts';
  END IF;
  
  -- Unpin all other posts in the community
  UPDATE community_posts
  SET pinned = false, pinned_at = NULL
  WHERE community_posts.community_id = pin_community_post.community_id;
  
  -- Pin the specified post
  UPDATE community_posts
  SET pinned = true, pinned_at = now()
  WHERE community_posts.id = post_id
  AND community_posts.community_id = pin_community_post.community_id;
END;
$$;

-- Create function to pin/unpin events
CREATE OR REPLACE FUNCTION pin_community_event(event_id uuid, community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin of the community
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = pin_community_event.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only community admins can pin events';
  END IF;
  
  -- Unpin all other events in the community
  UPDATE events
  SET pinned = false, pinned_at = NULL
  WHERE events.community_id = pin_community_event.community_id;
  
  -- Pin the specified event
  UPDATE events
  SET pinned = true, pinned_at = now()
  WHERE events.id = event_id
  AND events.community_id = pin_community_event.community_id;
END;
$$;

-- Create function to unpin posts/events
CREATE OR REPLACE FUNCTION unpin_community_post(post_id uuid, community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin of the community
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = unpin_community_post.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only community admins can unpin posts';
  END IF;
  
  -- Unpin the specified post
  UPDATE community_posts
  SET pinned = false, pinned_at = NULL
  WHERE community_posts.id = post_id
  AND community_posts.community_id = unpin_community_post.community_id;
END;
$$;

CREATE OR REPLACE FUNCTION unpin_community_event(event_id uuid, community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if user is admin of the community
  SELECT EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = unpin_community_event.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only community admins can unpin events';
  END IF;
  
  -- Unpin the specified event
  UPDATE events
  SET pinned = false, pinned_at = NULL
  WHERE events.id = event_id
  AND events.community_id = unpin_community_event.community_id;
END;
$$;


