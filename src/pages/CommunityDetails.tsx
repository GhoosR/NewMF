import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CommunityHeader } from '../components/Communities/CommunityHeader';
import { CreatePostForm } from '../components/Communities/CreatePostForm';
import { CommunityPost } from '../components/Communities/CommunityPost';
import { createJoinRequest } from '../lib/communities/joinRequests';
import type { Community, CommunityPost as CommunityPostType } from '../types/communities';

export function CommunityDetails() {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [memberCount, setMemberCount] = useState(0);

  const fetchData = async () => {
    if (!id) return;

    try {
      // Get community details with owner info
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select(`
          *,
          owner:users!communities_owner_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Get member count
      const { count, error: countError } = await supabase
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', id);

      if (countError) throw countError;
      setMemberCount(count || 0);

      // Check if user is a member
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('role')
          .eq('community_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsMember(!!memberData);

        // If member, fetch posts
        if (memberData) {
          const { data: postsData, error: postsError } = await supabase
            .from('community_posts')
            .select(`
              *,
              user:users!community_posts_user_id_fkey (
                username,
                avatar_url
              ),
              _count: community_post_comments (count)
            `)
            .eq('community_id', id)
            .order('created_at', { ascending: false });

          if (postsError) throw postsError;
          setPosts(postsData || []);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleJoin = async () => {
    if (!community) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (community.type === 'private') {
        await createJoinRequest(community.id);
        alert('Join request sent successfully');
      } else {
        const { error } = await supabase
          .from('community_members')
          .insert([{
            community_id: community.id,
            user_id: user.id,
            role: 'member'
          }]);

        if (error) throw error;
        await fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-content">
            {error || 'Community not found'}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CommunityHeader 
        community={community}
        memberCount={memberCount}
        isMember={isMember}
        onJoin={handleJoin}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isMember ? (
          <>
            <CreatePostForm communityId={community.id} onSuccess={fetchData} />
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">No posts yet. Be the first to share something!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <CommunityPost 
                    key={post.id} 
                    post={post}
                    onDelete={() => {
                      // Remove the post from local state immediately for better UX
                      setPosts(prev => prev.filter(p => p.id !== post.id));
                      // Then refresh to ensure consistency
                      fetchData();
                    }}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">Join this community to see posts and participate in discussions.</p>
          </div>
        )}
      </div>
    </div>
  );
}