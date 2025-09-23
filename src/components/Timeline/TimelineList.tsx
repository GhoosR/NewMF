import React from 'react';
import { TimelinePost } from './TimelinePost';
import type { TimelinePost as TimelinePostType } from '../../types/timeline';
import { supabase } from '../../lib/supabase';

interface TimelineListProps {
  posts: TimelinePostType[];
  loadingMore: boolean;
  hasMore: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
  onPostDelete: () => void;
}

export function TimelineList({ posts, loadingMore, hasMore, observerRef, onPostDelete }: TimelineListProps) {
  const [commentCounts, setCommentCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const fetchCommentCounts = async () => {
      const postIds = posts.map(post => post.id);
      if (postIds.length === 0) return;

      const { data } = await supabase
        .from('timeline_post_comments')
        .select('post_id, count', { count: 'exact' })
        .in('post_id', postIds)
        .select();

      if (data) {
        const counts = data.reduce((acc, curr) => {
          acc[curr.post_id] = (acc[curr.post_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        setCommentCounts(counts);
      }
    };

    fetchCommentCounts();
  }, [posts]);

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <TimelinePost 
          key={post.id} 
          post={post} 
          commentCount={commentCounts[post.id] || 0}
          onDelete={onPostDelete}
        />
      ))}

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-text"></div>
        </div>
      )}

      {/* Intersection observer target */}
      <div ref={observerRef} className="h-20 -mt-10" />

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-content/60 py-4">No more posts to load</p>
      )}
    </div>
  );
}