import React, { useState, useRef } from 'react';
import { Camera, Video } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadMedia } from '../../lib/storage';
import { UserMentionInput } from '../ui/UserMentionInput';
import { createNotification } from '../../lib/notifications';

interface CreatePostFormProps {
  communityId: string;
  onSuccess: () => void;
}

export function CreatePostForm({ communityId, onSuccess }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user on mount
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
    if (!content.trim() && mediaFiles.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images if any
      const mediaUrls = await Promise.all(
        mediaFiles.map(async (file) => {
          const isVideo = file.type.startsWith('video/');
          const bucket = isVideo ? 'post-videos' : 'post-images';
          
          try {
            return await uploadMedia(file, bucket);
          } catch (error) {
            console.error('Error uploading file:', error);
            setError(error.message || 'Failed to upload file');
            throw error;
          }
        })
      );

      // Create post
      const { error: insertError } = await supabase
        .from('community_posts')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          content,
          images: mediaUrls.filter(Boolean)
        }]);

      if (insertError) throw insertError;

      // Send notifications to mentioned users
      if (mentionedUsers.length > 0) {
        const notifications = mentionedUsers.map(userId => ({
          userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${currentUser?.username || 'Someone'} mentioned you in a community post`,
          data: {
            post_type: 'community',
            community_id: communityId,
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
      setMediaFiles([]);
      setMentionedUsers([]);
      
      // Refocus the textarea for better UX with delay
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      // Ensure focus is restored even if there was an error
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 150);
    }
  };

  const handleMediaClick = () => {
    fileInputRef.current?.click();
  };

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(''); // Clear any previous errors
    
    if (files.length + mediaFiles.length > 4) {
      setError('Maximum 4 media files allowed');
      return;
    }
    
    // Validate files
    for (const file of files) {
      // Check file type first
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Only image and video files are allowed');
        return;
      }
      
      if (file.type.startsWith('video/')) {
        // Check video file size (max 50MB for videos)
        if (file.size > 50 * 1024 * 1024) {
          setError('Video files must be smaller than 50MB');
          return;
        }
      } else if (file.type.startsWith('image/')) {
        // Check image file size (max 10MB for images)
        if (file.size > 10 * 1024 * 1024) {
          setError('Image files must be smaller than 10MB');
          return;
        }
      }
    }
    
    setMediaFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <UserMentionInput
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onMentionedUsersChange={setMentionedUsers}
            placeholder="Share something with your community..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent-text/20 focus:border-accent-text resize-none"
          />
          <div className="absolute bottom-3 right-3 flex items-center space-x-2 pointer-events-none">
            <button
              type="button"
              onClick={handleMediaClick}
              className="p-2 text-gray-500 hover:text-accent-text rounded-full hover:bg-gray-100 pointer-events-auto"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleMediaChange}
        />

        {mediaFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative">
                {file.type.startsWith('video/') ? (
                  <video
                    src={URL.createObjectURL(file)}
                    className="h-16 w-16 object-cover rounded-lg"
                    muted
                    loop
                    autoPlay
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || (!content.trim() && mediaFiles.length === 0)}
            className="px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}