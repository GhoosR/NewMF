import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Comment } from './Comment';
import { UserMentionInput } from '../../ui/UserMentionInput';
import { createNotification } from '../../../lib/notifications';
import type { CommentType } from '../../../types/communities';

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
  onCommentDeleted?: () => void;
}

export function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
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
        .from('community_post_comments')
        .select(`
          id,
          post_id,
          parent_id,
          user_id,
          content,
          created_at,
          user:users!community_post_comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Organize comments into a tree structure
      const commentMap = new Map<string, CommentType>();
      const rootComments: CommentType[] = [];

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
            parent.replies.push(commentWithReplies);
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
        .from('community_post_comments')
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
            post_type: 'community',
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
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.map((comment) => (
          <Comment
            key={comment.id}
            comment={comment}
            onReplyAdded={fetchComments}
            onCommentDeleted={() => {
              fetchComments();
              onCommentDeleted?.();
            }}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <UserMentionInput
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onMentionedUsersChange={setMentionedUsers}
          placeholder="Write a comment..."
          className="w-full bg-transparent border-0 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-0 resize-none min-h-[60px]"
          rows={2}
        />
        <div className="flex justify-end px-4 pb-4">
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}