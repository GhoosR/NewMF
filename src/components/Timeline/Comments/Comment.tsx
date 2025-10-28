import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Reply, Trash2, MoreVertical } from 'lucide-react';
import { Avatar } from '../../Profile/Avatar';
import { formatDate } from '../../../lib/utils/dateUtils';
import { ReplyForm } from './ReplyForm';
import type { TimelineComment } from '../../../types/timeline';
import { renderContentWithMentions } from '../../../lib/utils/mentionUtils';
import { supabase } from '../../../lib/supabase';
import { useAdmin } from '../../../lib/hooks/useAdmin';

interface CommentProps {
  comment: TimelineComment;
  onReplyAdded: () => void;
  onCommentDeleted?: () => void;
  level?: number;
}

export function Comment({ comment, onReplyAdded, onCommentDeleted, level = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isOwnComment, setIsOwnComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isAdmin } = useAdmin();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnComment(user?.id === comment.user_id);
    };
    checkOwnership();
  }, [comment.user_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReplyAdded();
  };

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('timeline_post_comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      onCommentDeleted?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = isAdmin || isOwnComment;

  return (
    <div className="flex space-x-3">
      <div className="flex-shrink-0">
        <Link to={`/profile/${comment.user?.username}/listings`}>
          <Avatar
            url={comment.user?.avatar_url}
            size="sm"
            userId={comment.user?.username}
            editable={false}
          />
        </Link>
      </div>
      <div className="flex-1">
        <div className="bg-accent-base/10 rounded-lg p-3 border border-accent-text/5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm text-content">
              {comment.user?.username || 'Anonymous'}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-content/60">
                {formatDate(new Date(comment.created_at))}
              </span>
              {canDelete && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 hover:bg-accent-text/10 rounded transition-colors"
                    disabled={isDeleting}
                  >
                    <MoreVertical className="h-4 w-4 text-content/60" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-white border border-accent-text/10 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={handleDeleteComment}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div 
            className="text-sm text-content/80"
            dangerouslySetInnerHTML={{ __html: renderContentWithMentions(comment.content) }}
          />
        </div>

        {level < 3 && (
          <div className="mt-1">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-content/60 hover:text-accent-text flex items-center transition-colors"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </button>
            {showReplyForm && (
              <div className="mt-2">
                <ReplyForm
                  parentId={comment.id}
                  postId={comment.post_id}
                  onSuccess={handleReplySuccess}
                  onCancel={() => setShowReplyForm(false)}
                />
              </div>
            )}
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-3 border-l border-accent-text/10">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                onReplyAdded={onReplyAdded}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}