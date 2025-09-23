import React, { useState, useRef, useCallback } from 'react';
import { Camera, Video, AtSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadMedia } from '../../lib/storage';
import { Avatar } from '../Profile/Avatar';
import { UserMentionInput } from '../ui/UserMentionInput';
import { createNotification } from '../../lib/notifications';

interface CreateTimelinePostProps {
  onSuccess: () => void;
}

export function CreateTimelinePost({ onSuccess }: CreateTimelinePostProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; avatar_url?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  // Get current user on mount
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Get user profile data including avatar
        const { data: profile } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        setCurrentUser({
          id: user.id,
          avatar_url: profile?.avatar_url
        });
      }
    };
    getUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && mediaFiles.length === 0) || loading) return;

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
        .from('timeline_posts')
        .insert([{
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
          message: `${currentUser?.username || 'Someone'} mentioned you in a post`,
          data: {
            post_id: insertError ? null : 'timeline_post', // We don't have the post ID here
            post_type: 'timeline',
            sender_id: user.id,
            sender_username: currentUser?.username,
            sender_avatar_url: currentUser?.avatar_url,
            content_preview: content.substring(0, 100)
          }
        }));

        // Create notifications for mentioned users
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
    <div>
      <div className="flex space-x-3">
        <Avatar 
          url={currentUser?.avatar_url}
          size="sm"
          userId={currentUser?.id}
          editable={false}
        />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <UserMentionInput
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
              }}
              onMentionedUsersChange={setMentionedUsers}
              placeholder="Share something with the community..."
              className="w-full resize-none bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 p-0 min-h-[60px]"
            />

            {mediaFiles.length > 0 && (
              <div className={`mt-3 grid gap-3 ${
                mediaFiles.length === 1 ? 'grid-cols-1' : 
                mediaFiles.length === 2 ? 'grid-cols-2' :
                mediaFiles.length === 3 ? 'grid-cols-2 grid-rows-2' :
                'grid-cols-2'
              }`}>
                {mediaFiles.map((file, index) => (
                  <div 
                    key={index}
                    className={`relative rounded-lg overflow-hidden bg-gray-100 ${
                      mediaFiles.length === 3 && index === 0 ? 'row-span-2' : ''
                    }`}
                    style={{
                      aspectRatio: '1/1',
                      maxWidth: '1080px',
                      maxHeight: '1080px'
                    }}
                  >
                    {file.type.startsWith('video/') ? (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%'
                        }}
                        muted
                        loop
                        autoPlay
                      />
                    ) : (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={"Preview " + (index + 1)}
                        className="w-full h-full object-cover"
                        style={{
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-2 text-red-600 text-sm">{error}</div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleMediaClick}
                  className="p-2 text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
                >
                  <Camera className="h-5 w-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={loading || (!content.trim() && mediaFiles.length === 0)}
                className="px-4 py-2 bg-accent-text text-white rounded-full font-medium hover:bg-accent-text/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}