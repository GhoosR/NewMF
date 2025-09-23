import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Reply } from 'lucide-react';
import { Avatar } from '../../Profile/Avatar';
import { formatDate } from '../../../lib/utils/dateUtils';
import { ReplyForm } from './ReplyForm';
import type { TimelineComment } from '../../../types/timeline';
import { renderContentWithMentions } from '../../../lib/utils/mentionUtils';

interface CommentProps {
  comment: TimelineComment;
  onReplyAdded: () => void;
  level?: number;
}

export function Comment({ comment, onReplyAdded, level = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReplySuccess = () => {
    setShowReplyForm(false);
    onReplyAdded();
  };

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
            <span className="text-xs text-content/60">
              {formatDate(new Date(comment.created_at))}
            </span>
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