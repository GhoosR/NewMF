import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TimelinePost } from '../../components/Timeline/TimelinePost';
import { CommunityPost } from '../../components/Communities/CommunityPost';
import { CreateTimelinePost } from '../../components/Timeline/CreateTimelinePost';
import type { TimelinePost as TimelinePostType } from '../../types/timeline';
import type { CommunityPost as CommunityPostType } from '../../types/communities';

interface TimelineTabProps {
  username: string;
}

interface CombinedPost {
  id: string;
  type: 'timeline' | 'community';
  data: TimelinePostType | CommunityPostType;
  created_at: string;
}

export function TimelineTab({ username }: TimelineTabProps) {
  const [posts, setPosts] = useState<CombinedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Check if current user is admin
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(!!userData?.is_admin);
      }

      // Get user profile from username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username)
        .single();

      if (userError) {
        throw new Error('User not found');
      }

      if (userData) {
        setIsOwnProfile(user?.id === userData.id);

        // Fetch timeline posts
        const { data: timelinePosts, error: timelineError } = await supabase
          .from('timeline_posts')
          .select(`
            *,
            user:users!timeline_posts_user_id_fkey (
              username,
              avatar_url
            ),
            _count: timeline_post_comments (count)
          `)
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (timelineError) throw timelineError;

        // Fetch community posts from public communities only
        const { data: communityPosts, error: communityError } = await supabase
          .from('community_posts')
          .select(`
            *,
            user:users!community_posts_user_id_fkey (
              username,
              avatar_url
            ),
            community:communities!community_posts_community_id_fkey (
              id,
              name,
              type
            ),
            community_post_comments(count)
          `)
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false });

        if (communityError) throw communityError;

        // Filter community posts to only include public communities
        const publicCommunityPosts = (communityPosts || []).filter(
          post => post.community?.type === 'public'
        );

        // Combine and sort all posts by creation date
        const combinedPosts: CombinedPost[] = [
          ...(timelinePosts || []).map(post => ({
            id: `timeline-${post.id}`,
            type: 'timeline' as const,
            data: post,
            created_at: post.created_at
          })),
          ...publicCommunityPosts.map(post => ({
            id: `community-${post.id}`,
            type: 'community' as const,
            data: post,
            created_at: post.created_at
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setPosts(combinedPosts);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [username]);

  const handleDelete = async (postId: string, postType: 'timeline' | 'community') => {
    try {
      const tableName = postType === 'timeline' ? 'timeline_posts' : 'community_posts';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', postId);

      if (error) throw error;
      
      // Update the posts list after successful deletion
      setPosts(prevPosts => prevPosts.filter(post => post.data.id !== postId));
    } catch (err: any) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <CreateTimelinePost onSuccess={fetchPosts} />
      )}

      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {posts.length === 0 ? (
        <div className="bg-background rounded-lg p-8 text-center">
          <p className="text-content/60">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              {post.type === 'community' && (
                <div className="mb-2 text-sm text-content/60 flex items-center">
                  <span className="px-2 py-1 bg-accent-base/20 text-accent-text rounded-full text-xs">
                    {post.data.community?.name}
                  </span>
                </div>
              )}
              {post.type === 'timeline' ? (
                <TimelinePost
                  post={post.data as TimelinePostType}
                  commentCount={post.data._count?.comments || 0}
                  onDelete={() => handleDelete(post.data.id, 'timeline')}
                />
              ) : (
                <CommunityPost
                  post={post.data as CommunityPostType}
                  commentCount={post.data._count?.comments || 0}
                  onDelete={() => handleDelete(post.data.id, 'community')}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}