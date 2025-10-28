-- Fix search function to include country filtering

-- Drop existing function first to avoid return type conflicts
DROP FUNCTION IF EXISTS search_all(text);

CREATE FUNCTION search_all(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  description text,
  type text,
  username text,
  avatar_url text,
  country text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- Search practitioners
  SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    'practitioner'::text as type,
    u.username,
    u.avatar_url,
    p.country,
    p.created_at
  FROM practitioners p
  JOIN users u ON p.user_id = u.id
  WHERE p.approval_status = 'approved'
    AND (
      p.title ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.country ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search events
  SELECT 
    e.id,
    e.title,
    e.slug,
    e.description,
    'event'::text as type,
    u.username,
    u.avatar_url,
    e.country,
    e.created_at
  FROM events e
  JOIN users u ON e.user_id = u.id
  WHERE e.approval_status = 'approved'
    AND (
      e.title ILIKE '%' || search_query || '%'
      OR e.description ILIKE '%' || search_query || '%'
      OR e.country ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search venues
  SELECT 
    v.id,
    v.title,
    v.slug,
    v.description,
    'venue'::text as type,
    u.username,
    u.avatar_url,
    v.country,
    v.created_at
  FROM venues v
  JOIN users u ON v.user_id = u.id
  WHERE v.approval_status = 'approved'
    AND (
      v.title ILIKE '%' || search_query || '%'
      OR v.description ILIKE '%' || search_query || '%'
      OR v.country ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search courses
  SELECT 
    c.id,
    c.title,
    c.id::text as slug, -- Courses still use ID as slug
    c.description,
    'course'::text as type,
    u.username,
    u.avatar_url,
    c.country,
    c.created_at
  FROM courses c
  JOIN users u ON c.user_id = u.id
  WHERE c.approval_status = 'approved'
    AND (
      c.title ILIKE '%' || search_query || '%'
      OR c.description ILIKE '%' || search_query || '%'
      OR c.country ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search recipes
  SELECT 
    r.id,
    r.title,
    r.slug,
    r.description,
    'recipe'::text as type,
    u.username,
    u.avatar_url,
    NULL::text as country, -- Recipes don't have country field
    r.created_at
  FROM recipes r
  JOIN users u ON r.user_id = u.id
  WHERE r.approval_status = 'approved'
    AND (
      r.title ILIKE '%' || search_query || '%'
      OR r.description ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search users
  SELECT 
    u.id,
    u.full_name as title,
    u.username as slug,
    u.bio as description,
    'user'::text as type,
    u.username,
    u.avatar_url,
    NULL::text as country, -- Users don't have country field in search context
    u.created_at
  FROM users u
  WHERE u.full_name ILIKE '%' || search_query || '%'
    OR u.username ILIKE '%' || search_query || '%'
    OR u.bio ILIKE '%' || search_query || '%'
  
  ORDER BY created_at DESC
  LIMIT 20;
END;
$$;

