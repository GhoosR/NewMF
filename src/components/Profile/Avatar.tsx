import React from 'react';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadImage } from '../../lib/storage';
import { supabase } from '../../lib/supabase';

interface AvatarProps {
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  userId?: string;
  username?: string;
  onUpdate?: () => void;
  editable?: boolean;
  disableLink?: boolean;
}

export function Avatar({ 
  url, 
  size = 'md', 
  userId,
  username,
  onUpdate,
  editable = false,
  disableLink = false
}: AvatarProps) {
  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(url);
  const [loading, setLoading] = React.useState(false);

  // Fetch avatar if not provided but userId is available
  React.useEffect(() => {
    if (!url && userId && !loading) {
      setLoading(true);
      supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (data?.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
        })
        .catch(error => {
          console.error('Error fetching avatar:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setAvatarUrl(url);
    }
  }, [url, userId]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-32 w-32'
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const publicUrl = await uploadImage(file, 'avatars');
      if (!publicUrl) return;

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update user profile
      await supabase
        .from('users')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      // Update local state
      setAvatarUrl(publicUrl);

      // Call onUpdate callback if provided
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const content = (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 relative group`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <User className="h-1/2 w-1/2 text-gray-400" />
        </div>
      )}
      
      {editable && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <label className="text-white text-xs cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            Change
          </label>
        </div>
      )}
    </div>
  );

  // If this Avatar is being rendered inside a Link component, don't wrap it in another Link
  if (username && !editable && !disableLink && !window.location.pathname.startsWith('/profile/')) {
    return (
      <Link to={`/profile/${username}/listings`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}