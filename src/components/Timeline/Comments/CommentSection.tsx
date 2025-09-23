import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Comment } from './Comment';
import { UserMentionInput } from '../../ui/UserMentionInput';
import { createNotification } from '../../../lib/notifications';
import type { TimelineComment } from '../../../types/timeline';

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const [comments, setComments] = useState<TimelineComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();

        setCurrentUser({
          id: user.id,
          username: profile?.username,
          avatar_url: profile?.avatar_url
        });
      }
    };
    getUser();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('timeline_post_comments')
        .select(`
          id,
          post_id,
          parent_id,
          user_id,
          content,
          created_at,
          user:users!timeline_post_comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map<string, TimelineComment>();
      const rootComments: TimelineComment[] = [];

      // First pass: create map of all comments
      data.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into tree structure
      data.forEach(comment => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies?.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('timeline_post_comments')
        .insert([{
          post_id: postId,
          content: newComment.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      
      // Send notifications to mentioned users
      if (mentionedUsers.length > 0) {
        const notifications = mentionedUsers.map(userId => ({
          userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${currentUser?.username || 'Someone'} mentioned you in a comment`,
          data: {
            post_id: postId,
            post_type: 'timeline',
            sender_id: user.id,
            sender_username: currentUser?.username,
            sender_avatar_url: currentUser?.avatar_url,
            content_preview: newComment.substring(0, 100)
          }
        }));

        await Promise.all(
          notifications.map(notification => createNotification(notification))
        );
      }

      setNewComment('');
      setMentionedUsers([]);
      await fetchComments();
      onCommentAdded();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onReplyAdded={fetchComments}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <UserMentionInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onMentionedUsersChange={setMentionedUsers}
          placeholder="Write a comment..."
          className="flex-1 bg-accent-base/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-0 border border-transparent hover:border-accent-text/10 transition-colors"
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </form>
    </div>
  );
}