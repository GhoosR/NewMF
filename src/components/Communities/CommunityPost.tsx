import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MoreVertical, Edit, Trash2, Save, X, Camera, Pin } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { CommentSection } from './Comments/CommentSection';
import { formatDate } from '../../lib/utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { uploadMedia } from '../../lib/storage';
import { renderContentWithMentions } from '../../lib/utils/mentionUtils';
import { UserMentionInput } from '../ui/UserMentionInput';
import { createNotification } from '../../lib/notifications';
import type { CommunityPostType } from '../../types/communities';

interface CommunityPostProps {
  post: CommunityPostType & {
    pinned?: boolean;
    pinned_at?: string;
  };
  isAdmin?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
}

export function CommunityPost({ post, isAdmin = false, onPin, onUnpin, onDelete }: CommunityPostProps) {
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const postRef = React.useRef<HTMLDivElement>(null);
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

  React.useEffect(() => {
    // Check if current user is the post owner
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsOwnPost(user?.id === post.user_id);
    });

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [post.user_id]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(post.content);
    setEditImages([]);
    setShowMenu(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(post.content);
    setEditImages([]);
    setMentionedUsers([]);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() && editImages.length === 0) return;

    setSaving(true);
    try {
      // Upload new images if any
      const newImageUrls = await Promise.all(
        editImages.map(async (file) => {
          const isVideo = file.type.startsWith('video/');
          const bucket = isVideo ? 'post-videos' : 'post-images';
          
          try {
            return await uploadMedia(file, bucket);
          } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
          }
        })
      );

      // Combine existing images with new ones
      const allImages = [...(post.images || []), ...newImageUrls.filter(Boolean)];

      const { error } = await supabase
        .from('community_posts')
        .update({
          content: editContent,
          images: allImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);

      if (error) throw error;

      // Send notifications to newly mentioned users
      if (mentionedUsers.length > 0) {
        const notifications = mentionedUsers.map(userId => ({
          userId,
          type: 'mention',
          title: 'You were mentioned',
          message: `${currentUser?.username || 'Someone'} mentioned you in an updated community post`,
          data: {
            post_id: post.id,
            post_type: 'community',
            community_id: post.community_id,
            sender_id: currentUser?.id,
            sender_username: currentUser?.username,
            sender_avatar_url: currentUser?.avatar_url,
            content_preview: editContent.substring(0, 100)
          }
        }));

        await Promise.all(
          notifications.map(notification => createNotification(notification))
        );
      }

      // Update local state
      post.content = editContent;
      post.images = allImages;
      setIsEditing(false);
      setEditImages([]);
      setMentionedUsers([]);
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setIsDeleting(true);

      // Add delete animation
      if (postRef.current) {
        postRef.current.style.transition = 'all 0.3s ease-out';
        postRef.current.style.opacity = '0';
        postRef.current.style.transform = 'translateY(-20px)';
      }

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 300));

      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      
      // Call onDelete after successful deletion
      onDelete?.();
    } catch (error) {
      console.error('Error deleting post:', error);
      // Reset animation if deletion fails
      if (postRef.current) {
        postRef.current.style.opacity = '1';
        postRef.current.style.transform = 'translateY(0)';
      }
      setIsDeleting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + editImages.length > 4) {
      alert('Maximum 4 media files allowed');
      return;
    }
    setEditImages(prev => [...prev, ...files]);
  };

  const removeEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    if (post.images) {
      post.images = post.images.filter((_, i) => i !== index);
    }
  };

  return (
    <div 
      ref={postRef}
      className={`bg-white rounded-lg shadow-sm p-4 mb-4 hover:shadow-md transition-all ${
        post.pinned ? 'ring-2 ring-accent-text' : ''
      }`}
      style={{ 
        opacity: 1,
        transform: 'translateY(0)',
      }}
    >
      {post.pinned && (
        <div className="bg-accent-text text-white px-3 py-1 text-xs font-medium flex items-center mb-3 -mx-4 -mt-4">
          <Pin className="h-3 w-3 mr-1" />
          Pinned Post
        </div>
      )}
      <div className="flex space-x-3">
        <Link to={`/profile/${post.user?.username}/listings`}>
          <Avatar
            url={post.user?.avatar_url}
            size="sm"
            username={post.user?.username}
            editable={false}
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Link 
                to={`/profile/${post.user?.username}/listings`}
                className="font-medium text-content hover:text-accent-text transition-colors truncate"
              >
                <Username 
                  username={post.user?.username || 'Anonymous'}
                  userId={post.user_id}
                  verified={post.user?.verified}
                />
              </Link>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">
                {formatDate(new Date(post.created_at))}
              </span>
            </div>
            {(isOwnPost || isAdmin) && (
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-content/60 hover:text-content rounded-full hover:bg-accent-base/10 transition-colors"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-accent-text/10">
                    {isAdmin && (
                      <>
                        {post.pinned ? (
                          <button
                            onClick={() => {
                              onUnpin?.();
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-content hover:bg-accent-base/10 transition-colors flex items-center"
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            Unpin Post
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onPin?.();
                              setShowMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-content hover:bg-accent-base/10 transition-colors flex items-center"
                          >
                            <Pin className="h-4 w-4 mr-2" />
                            Pin Post
                          </button>
                        )}
                      </>
                    )}
                    {isOwnPost && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-4 py-2 text-sm text-content hover:bg-accent-base/10 transition-colors flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3 mb-3 space-y-3">
              <UserMentionInput
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onMentionedUsersChange={setMentionedUsers}
                className="w-full p-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 resize-none"
                rows={4}
                placeholder="What's on your mind?"
              />
              
              {/* Existing Images */}
              {post.images && post.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-content">Current Images:</h4>
                  <div className="flex flex-wrap gap-2">
                    {post.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Current ${index + 1}`}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {editImages.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-content">New Images:</h4>
                  <div className="flex flex-wrap gap-2">
                    {editImages.map((file, index) => (
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
                            alt={`New ${index + 1}`}
                            className="h-16 w-16 object-cover rounded-lg"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-sm text-accent-text hover:text-accent-text/80"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Add Images
                </button>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 text-sm text-content/60 hover:text-content rounded-md flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || (!editContent.trim() && editImages.length === 0)}
                    className="px-3 py-1.5 text-sm bg-accent-text text-white rounded-md hover:bg-accent-text/90 disabled:opacity-50 flex items-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="text-content whitespace-pre-line mt-3 mb-3 text-lg"
              dangerouslySetInnerHTML={{ __html: renderContentWithMentions(post.content) }}
            />
          )}
          
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-3 ${
              post.images.length === 1 ? 'grid-cols-1' : 
              post.images.length === 2 ? 'grid-cols-2' :
              post.images.length === 3 ? 'grid-cols-2 grid-rows-2' :
              'grid-cols-2'
            }`}>
              {post.images.map((image, index) => (
                <div 
                  key={index}
                  className={`relative group overflow-hidden rounded-lg ${
                    post.images.length === 3 && index === 0 ? 'row-span-2' : ''
                  }`}
                >
                  {image.includes('.mp4') || image.includes('.mov') || image.includes('.webm') || image.includes('.avi') || image.includes('video') ? (
                    <video
                      src={image}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      controls
                      muted
                      loop
                      preload="metadata"
                      playsInline
                    />
                  ) : (
                    <img
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-accent-text/10">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center text-sm text-content/60 hover:text-accent-text transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{post._count?.comments || 0} comments</span>
              </button>
            </div>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t border-accent-text/10">
              <CommentSection 
                postId={post.id} 
                onCommentAdded={() => {
                  // Refresh comment count
                  if (post._count) {
                    post._count.comments = (post._count.comments || 0) + 1;
                  }
                }} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}