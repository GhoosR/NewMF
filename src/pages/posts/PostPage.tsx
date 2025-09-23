import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TimelinePost } from '../../components/Timeline/TimelinePost';
import type { TimelinePost as TimelinePostType } from '../../types/timeline';

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<TimelinePostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error } = await supabase
          .from('timeline_posts')
          .select(`
            *,
            user:users!timeline_posts_user_id_fkey (
              username,
              avatar_url
            ),
            _count: timeline_post_likes(count)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Post not found');
        
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPost();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-content mb-4">
            {error || 'Post not found'}
          </h2>
          <Link 
            to="/"
            className="text-accent-text hover:text-accent-text/80"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-accent-text hover:text-accent-text/80 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </button>

      <TimelinePost post={post} />
    </div>
  );
}