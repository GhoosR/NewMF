import { supabase } from '../supabase';
import type { Community, CommunityPost } from '../../types/communities';

export async function getCommunityDetails(id: string): Promise<{
  community: Community;
  memberCount: number;
  isMember: boolean;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get community details
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', id)
    .single();

  if (communityError) throw communityError;

  // Get member count
  const { count: memberCount } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', id);

  // Check membership
  const { data: memberData } = await supabase
    .from('community_members')
    .select('role')
    .eq('community_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    community,
    memberCount: memberCount || 0,
    isMember: !!memberData
  };
}

export async function getCommunityPosts(communityId: string): Promise<CommunityPost[]> {
  // Get posts with user info
  const { data: posts, error: postsError } = await supabase
    .from('community_posts')
    .select(`
      *,
      user:users (
        username,
        avatar_url
      )
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false });

  if (postsError) throw postsError;

  // Get comment counts
  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post) => {
      const { count } = await supabase
        .from('community_post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      return {
        ...post,
        _count: {
          comments: count || 0
        }
      };
    })
  );

  return postsWithCounts;
}

export async function joinCommunity(communityId: string, type: 'public' | 'private') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (type === 'private') {
    const { error } = await supabase
      .from('community_join_requests')
      .insert([{
        community_id: communityId,
        user_id: user.id,
        status: 'pending'
      }]);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('community_members')
      .insert([{
        community_id: communityId,
        user_id: user.id,
        role: 'member'
      }]);

    if (error) throw error;
  }
}