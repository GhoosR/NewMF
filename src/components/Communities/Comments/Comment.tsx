import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reply, MoreVertical, Edit, Trash2, Save, X } from 'lucide-react';
import { Avatar } from '../../Profile/Avatar';
import { Username } from '../../Profile/Username';
import { formatDate } from '../../../lib/utils/dateUtils';
import { ReplyForm } from './ReplyForm';
import { supabase } from '../../../lib/supabase';
import { renderContentWithMentions } from '../../../lib/utils/mentionUtils';
import type { CommentType } from '../../../types/communities';

interface CommentProps {
  comment: CommentType;
  onReplyAdded: () => void;
  level?: number;
}

export function Comment({ comment, onReplyAdded, level = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [isOwnComment, setIsOwnComment] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Check if current user is the comment owner
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwnComment(user?.id === comment.user_id);
    });

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [comment.user_id]);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReplyAdded();
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('community_post_comments')
        .update({
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', comment.id);

      if (error) throw error;

      // Update local state
      comment.content = editContent;
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('community_post_comments')
        .delete()
        .eq('id', comment.id);

      if (error) throw error;
      onReplyAdded(); // Refresh the comments
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="flex space-x-3">
      <Link to={`/profile/${comment.user?.username}/listings`}>
        <Avatar
          url={comment.user?.avatar_url}
          size="sm"
          userId={comment.user?.username}
          editable={false}
        />
      </Link>
      <div className="flex-1">
        <div className="bg-accent-base/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Username 
              username={comment.user?.username || 'Anonymous'}
              userId={comment.user_id}
              className="font-medium text-sm text-content"
            />
            <span className="text-xs text-content/60">
              {formatDate(new Date(comment.created_at))}
              {isOwnComment && (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                      <button
                        onClick={handleEdit}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center transition-colors"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteComment}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center transition-colors"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </span>
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-accent-text/20 focus:border-accent-text"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors flex items-center"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-3 py-1 text-xs bg-accent-text text-white rounded-md hover:bg-accent-text/90 transition-colors disabled:opacity-50 flex items-center"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="text-base text-content/80"
              dangerouslySetInnerHTML={{ __html: renderContentWithMentions(comment.content) }}
            />
          )}
        </div>

        {level < 3 && ( // Limit nesting to 3 levels
          <div className="mt-1">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-content/60 hover:text-accent-text flex items-center"
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
          <div className="mt-3 space-y-3 pl-3 border-l-2 border-accent-base">
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