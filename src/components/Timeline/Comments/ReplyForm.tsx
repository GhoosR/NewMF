import React, { useState } from 'react';
import { useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { UserMentionInput } from '../../ui/UserMentionInput';
import { createNotification } from '../../../lib/notifications';

interface ReplyFormProps {
  postId: string;
  parentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReplyForm({ postId, parentId, onSuccess, onCancel }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user
  React.useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('timeline_post_comments')
        .insert([{
          post_id: postId,
          parent_id: parentId,
          content: content.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;
      
      // Send notifications to mentioned users
      if (mentionedUsers.length > 0) {
        const notifications = mentionedUsers.map(userId => ({
          userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${currentUser?.username || 'Someone'} mentioned you in a reply`,
          data: {
            post_id: postId,
            post_type: 'timeline',
            sender_id: user.id,
            sender_username: currentUser?.username,
            sender_avatar_url: currentUser?.avatar_url,
            content_preview: content.substring(0, 100)
          }
        }));

        await Promise.all(
          notifications.map(notification => createNotification(notification))
        );
      }

      setContent('');
      setMentionedUsers([]);
      onSuccess();
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
      <div className="flex-1 relative">
        <UserMentionInput
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onMentionedUsersChange={setMentionedUsers}
          placeholder="Write a reply..."
          className="w-full bg-accent-base/20 rounded-lg px-3 py-1.5 pr-10 text-sm focus:outline-none focus:ring-0 border border-transparent hover:border-accent-text/10 transition-colors"
          rows={1}
        />
      </div>
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-content/60 hover:text-content transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="px-3 py-1.5 text-xs font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Posting...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}