import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { getLiveStreamDetails } from '../../lib/services/youtubeService';
import { supabase } from '../../lib/supabase';

interface LiveStreamPlayerProps {
  youtubeUrl: string;
  title: string;
  description?: string;
}

interface StreamDetails {
  title: string;
  description: string;
  viewerCount: number;
  status: string;
}

export function LiveStreamPlayer({ youtubeUrl, title, description }: LiveStreamPlayerProps) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamDetails, setStreamDetails] = useState<StreamDetails | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const extractVideoId = (url: string): string | null => {
    try {
      // Handle empty URL
      if (!url.trim()) {
        return null;
      }

      // Handle direct video ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
      }

      // Handle direct video ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
      }

      const parsedUrl = new URL(url);
      
      // Handle youtu.be format
      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname.slice(1);
      }
      
      // Handle youtube.com/live format
      if (parsedUrl.pathname.startsWith('/live/')) {
        const parts = parsedUrl.pathname.split('/');
        return parts.length >= 3 ? parts[2] : null;
      }
      
      // Handle youtube.com/live format
      if (parsedUrl.pathname.startsWith('/live/')) {
        return parsedUrl.pathname.split('/')[2];
      }
      
      // Handle youtube.com format with v parameter
      if (parsedUrl.searchParams.has('v')) {
        return parsedUrl.searchParams.get('v');
      }
      
      // Handle embed format
      const embedMatch = parsedUrl.pathname.match(/\/embed\/([^/]+)/);
      if (embedMatch) {
        return embedMatch[1];
      }
      
      // Handle watch format without query params
      const watchMatch = parsedUrl.pathname.match(/\/watch\/([^/]+)/);
      if (watchMatch) {
        return watchMatch[1];
      }
      
      return null;
    } catch (err) {
      console.error('Error parsing YouTube URL:', err);
      return null;
    }
  };

  // Function to load YouTube IFrame API
  const loadYouTubeAPI = () => {
    return new Promise<void>((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      
      // Define callback for when API is ready
      (window as any).onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  };

  // Function to initialize player
  const initializePlayer = async (videoId: string) => {
    await loadYouTubeAPI();

    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy();
    }

    playerInstanceRef.current = new (window as any).YT.Player(playerRef.current, {
      videoId,
      playerVars: {
        autoplay: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        controls: 0,
        fs: 0,
        playsinline: 1
      },
      events: {
        onReady: () => {
          setIsLoading(false);
          // Start playing immediately
          playerInstanceRef.current?.playVideo();
        },
        onStateChange: (event: any) => {
          // Handle player state changes
          if (event.data === (window as any).YT.PlayerState.ENDED) {
            // Stream ended
            setError('Stream has ended');
          }
        },
        onError: (event: any) => {
          console.error('YouTube player error:', event);
          setError('Error playing stream');
        }
      }
    });
  };

  // Function to fetch stream details
  const fetchStreamDetails = async (videoId: string) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const details = await getLiveStreamDetails(videoId);
      setStreamDetails(details);

      // Update stream status in database
      await supabase
        .from('live_stream_settings')
        .update({
          viewer_count: details.viewerCount,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

    } catch (err) {
      console.error('Error fetching stream details:', err);
    }
  };

  useEffect(() => {
    // Cleanup function
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    try {
      const extractedId = extractVideoId(youtubeUrl);

      if (!extractedId) {
        throw new Error('Invalid YouTube URL');
      }

      setVideoId(extractedId);
      initializePlayer(extractedId);
      
      // Start fetching stream details with cleanup
      let isMounted = true;
      const intervalId = setInterval(() => {
        if (isMounted) {
          fetchStreamDetails(extractedId);
        }
      }, 30000); // Update every 30 seconds
      
      // Initial fetch
      fetchStreamDetails(extractedId);
      
      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };

      setError(null);
    } catch (err) {
      console.error('Error parsing YouTube URL:', err);
      setVideoId(null);
      setError('Please provide a valid YouTube URL');
    }
  }, [youtubeUrl]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!videoId) {
    return null;
  }

  return (
    <div className="bg-black rounded-lg overflow-hidden relative select-none">
      {/* Overlay to prevent right-click and show custom context menu */}
      <div 
        className="absolute inset-0 z-10" 
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="aspect-video">
        <div 
          ref={playerRef} 
          className="w-full h-full"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent-text">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white"></div>
          </div>
        )}
      </div>
      <div className="p-6 bg-gradient-to-b from-black/80 to-black text-white">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        {(streamDetails?.description || description) && (
          <p className="text-white/80">{streamDetails?.description || description}</p>
        )}
        {streamDetails?.viewerCount !== undefined && (
          <p className="mt-2 text-white/60 text-sm">
            {streamDetails.viewerCount.toLocaleString()} watching now
          </p>
        )}
      </div>
    </div>
  );
}