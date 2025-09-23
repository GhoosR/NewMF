import { supabase } from '../supabase';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const CACHE_DURATION = 300000; // 5 minutes
const QUOTA_ERROR_CACHE_DURATION = 3600000; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  liveViewers?: number;
}

// Cache structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  error?: YouTubeError;
}

interface YouTubeError {
  isQuotaError: boolean;
  message: string;
  code?: number;
}

// Cache for live stream status
let liveStreamCache: CacheEntry<{ isLive: boolean; videoId: string | null }> | null = null;

// Cache for previous streams
let previousStreamsCache: CacheEntry<YouTubeVideo[]> | null = null;

// Function to get API key securely from environment
async function getApiKey(): Promise<string> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YouTube API key not configured');
  }
  return apiKey;
}

// Function to get channel ID securely from environment
async function getChannelId(): Promise<string> {
  const channelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    throw new Error('YouTube channel ID not configured');
  }
  return channelId;
}

// Helper function to handle API requests with retries
async function fetchWithRetry(
  url: string,
  options: RequestInit & { signal?: AbortSignal } = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      if (error.error?.code === 403 && error.error?.message?.includes('quota')) {
        throw { isQuotaError: true, message: error.error.message, code: 403 };
      }
      throw new Error(error.error?.message || response.statusText);
    }
    
    return response;
  } catch (error) {
    if (retries > 0 && !error.isQuotaError) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Helper function to check if cache is valid
function isCacheValid(cache: CacheEntry<any> | null, duration: number): boolean {
  if (!cache) return false;
  const now = Date.now();
  const cacheDuration = cache.error?.isQuotaError ? QUOTA_ERROR_CACHE_DURATION : duration;
  return now - cache.timestamp < cacheDuration;
}

// Function to get live stream status with retries and caching
/**
 * Checks if the channel has a live stream (either live or upcoming).
 */
export async function checkLiveStream(
  accessToken?: string
): Promise<{ isLive: boolean; videoId: string | null }> {
  if (!CHANNEL_ID) {
    throw new Error('YouTube channel ID not configured');
  }

  if (!API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  // Return cached data if valid
  if (liveStreamCache && isCacheValid(liveStreamCache, CACHE_DURATION)) {
    return liveStreamCache.data;
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Check for live streams
    const liveResponse = await fetchWithRetry(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${API_KEY}&maxResults=1`,
      { headers }
    );

    const liveData = await liveResponse.json();

    // If a live stream is found, return it
    if (liveData.items && liveData.items.length > 0) {
      const liveStream = liveData.items[0];
      
      // Update stream status in database
      await supabase
        .from('live_stream_settings')
        .update({
          is_live: true,
          youtube_url: `https://www.youtube.com/watch?v=${liveStream.id.videoId}`,
          title: liveStream.snippet.title,
          description: liveStream.snippet.description,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const result = {
        isLive: true,
        videoId: liveStream.id.videoId,
      };
      liveStreamCache = { data: result, timestamp: Date.now() };
      return result;
    }

    // If no live stream is found, check for upcoming streams
    const upcomingResponse = await fetchWithRetry(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${CHANNEL_ID}&eventType=upcoming&type=video&key=${API_KEY}&maxResults=1`,
      { headers }
    );

    const upcomingData = await upcomingResponse.json();

    // If an upcoming stream is found, return it
    if (upcomingData.items && upcomingData.items.length > 0) {
      const upcomingStream = upcomingData.items[0];
      
      // Update stream status in database
      await supabase
        .from('live_stream_settings')
        .update({
          is_live: false,
          youtube_url: `https://www.youtube.com/watch?v=${upcomingStream.id.videoId}`,
          title: upcomingStream.snippet.title,
          description: upcomingStream.snippet.description,
          updated_at: new Date().toISOString()
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const result = {
        isLive: false,
        videoId: upcomingStream.id.videoId,
      };
      liveStreamCache = { data: result, timestamp: Date.now() };
      return result;
    }

    // If no live or upcoming streams are found, return null
    const result = {
      isLive: false,
      videoId: null,
    };
    liveStreamCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error) {
    console.error('Error checking live stream:', error);

    // Cache error state
    const errorState = {
      isLive: false,
      videoId: null
    };
    liveStreamCache = {
      data: errorState,
      timestamp: Date.now(),
      error: {
        isQuotaError: error.isQuotaError || false,
        message: error.message || 'Unknown error',
        code: error.code
      }
    };

    return errorState;
  }
}

// Function to get live stream details
export async function getLiveStreamDetails(videoId: string): Promise<{
  title: string;
  description: string;
  viewerCount: number;
  status: string;
}> {
  try {
    const apiKey = await getApiKey();
    
    const response = await fetchWithRetry(
      `${YOUTUBE_API_BASE_URL}/videos?part=liveStreamingDetails,snippet&id=${videoId}&key=${apiKey}`
    );

    const data = await response.json();
    
    if (!data.items?.[0]) {
      throw new Error('Stream not found');
    }

    const stream = data.items[0];
    
    // Update viewer count in database
    await supabase
      .from('live_stream_settings')
      .update({
        viewer_count: stream.liveStreamingDetails?.concurrentViewers || 0,
        updated_at: new Date().toISOString()
      })
      .neq('id', '00000000-0000-0000-0000-000000000000');

    return {
      title: stream.snippet.title,
      description: stream.snippet.description,
      viewerCount: stream.liveStreamingDetails?.concurrentViewers || 0,
      status: stream.snippet.liveBroadcastContent
    };
  } catch (error) {
    console.error('Error getting stream details:', error);
    throw error;
  }
}

/**
 * Fetches previous streams (completed) for the channel.
 */
export async function getPreviousStreams(
  maxResults = 50
): Promise<YouTubeVideo[]> {
  // Return cached data if valid
  if (previousStreamsCache && isCacheValid(previousStreamsCache, CACHE_DURATION)) {
    return previousStreamsCache.data;
  }

  try {
    const apiKey = await getApiKey();
    
    // Fetch completed live streams
    const searchResponse = await fetchWithRetry(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&channelId=${channelId}&eventType=completed&type=video&maxResults=${maxResults}&order=date&key=${apiKey}`
    );

    const searchData = await searchResponse.json();

    // Extract video IDs
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

    // Fetch video statistics
    const statsResponse = await fetchWithRetry(
      `${YOUTUBE_API_BASE_URL}/videos?part=statistics&id=${videoIds}&key=${apiKey}`
    );

    const statsData = await statsResponse.json();

    // Combine search results with statistics
    const videos = searchData.items.map((item: any, index: number) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      publishedAt: item.snippet.publishedAt,
      viewCount: statsData.items[index]?.statistics?.viewCount || '0',
    }));

    // Update cache
    previousStreamsCache = {
      data: videos,
      timestamp: Date.now()
    };

    return videos;
  } catch (error) {
    console.error('Error fetching previous streams:', error);
    
    // Return cached data if available, otherwise empty array
    return previousStreamsCache?.data || [];
  }
}

/**
 * Fetches live stream status with caching.
 */
export async function getCachedLiveStreamStatus(): Promise<{ isLive: boolean; videoId: string | null }> {
  return checkLiveStream();
}