import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface MediaTabProps {
  userId: string;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  post_id: string;
  created_at: string;
}

export function MediaTab({ userId }: MediaTabProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMedia() {
      try {
        // Fetch posts with media
        const { data: posts, error: postsError } = await supabase
          .from('timeline_posts')
          .select('id, images, created_at')
          .eq('user_id', userId)
          .not('images', 'is', null)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Transform posts into media items
        const mediaItems: MediaItem[] = [];
        posts?.forEach(post => {
          if (post.images) {
            post.images.forEach(url => {
              mediaItems.push({
                id: `${post.id}-${url}`,
                url,
                type: 'image', // For now we only handle images
                post_id: post.id,
                created_at: post.created_at
              });
            });
          }
        });

        setMedia(mediaItems);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMedia();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600">{error}</div>
    );
  }

  return (
    <div>
      {media.length === 0 ? (
        <div className="text-center py-8 text-content/60">
          No media found
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {media.map((item) => (
            <div 
              key={item.id} 
              className="aspect-square relative group cursor-pointer overflow-hidden"
            >
              <img
                src={item.url}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}