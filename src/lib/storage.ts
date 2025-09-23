import { supabase } from './supabase';
import Compressor from 'compressorjs';

// Helper function to convert image to WebP format
async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(webpFile);
            } else {
              reject(new Error('Failed to convert to WebP'));
            }
          },
          'image/webp',
          quality
        );
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to check WebP support
function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

export type StorageBucket = 
  | 'avatars' 
  | 'banners' 
  | 'community-images' 
  | 'post-images' 
  | 'post-videos'
  | 'listing-images'
  | 'event-images'
  | 'venue-images'
  | 'job-images'
  | 'certification-images';

// Function to get video duration
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

export async function uploadMedia(file: File, bucket: StorageBucket): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      throw new Error('Only image and video files are supported');
    }

    // Check video duration if it's a video file
    if (isVideo) {
      try {
        const duration = await getVideoDuration(file);
        if (duration > 15) {
          throw new Error('Video must be 15 seconds or shorter');
        }
      } catch (error) {
        throw new Error('Unable to process video file. Please try a different video.');
      }
    }

    let processedFile = file;

    // Compress only if it's an image
    if (isImage) {
      // Check if browser supports WebP
      const webpSupported = await supportsWebP();
      
      if (webpSupported && file.type !== 'image/webp') {
        try {
          // First compress the image
          const compressedFile = await compressImage(file, {
            quality: 0.9, // Higher quality for WebP conversion
            maxWidth: bucket === 'avatars' ? 500 : 1920,
            maxHeight: bucket === 'avatars' ? 500 : 1080,
            convertSize: Infinity // Don't auto-convert to JPEG
          });
          
          // Then convert to WebP
          processedFile = await convertToWebP(compressedFile, 0.85);
        } catch (webpError) {
          console.warn('WebP conversion failed, falling back to standard compression:', webpError);
          // Fallback to standard compression
          processedFile = await compressImage(file, {
            quality: 0.8,
            maxWidth: bucket === 'avatars' ? 500 : 1920,
            maxHeight: bucket === 'avatars' ? 500 : 1080,
            convertSize: 1000000
          });
        }
      } else {
        // Standard compression for non-WebP browsers or already WebP files
        processedFile = await compressImage(file, {
          quality: 0.8,
          maxWidth: bucket === 'avatars' ? 500 : 1920,
          maxHeight: bucket === 'avatars' ? 500 : 1080,
          convertSize: 1000000
        });
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, processedFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    throw error;
  }
}

export async function compressImage(file: File, options: {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertSize?: number;
  success?: (result: File) => void;
  error?: (err: any) => void;
} = {}): Promise<File> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: options.quality || 0.8, // 80% quality by default
      maxWidth: options.maxWidth || 1920, // Max width 1920px by default
      maxHeight: options.maxHeight || 1080, // Max height 1080px by default
      convertSize: options.convertSize || 1000000, // Convert to JPG if > 1MB by default
      success: (result) => {
        // Create a new File object from the compressed Blob
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        });
        
        if (options.success) {
          options.success(compressedFile);
        }
        
        resolve(compressedFile);
      },
      error: (err) => {
        console.error('Image compression error:', err);
        
        if (options.error) {
          options.error(err);
        }
        
        // If compression fails, return original file
        resolve(file);
      },
    });
  });
}

export async function uploadImage(file: File, bucket: StorageBucket): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // Check if browser supports WebP
    const webpSupported = await supportsWebP();
    let processedFile = file;

    if (webpSupported && file.type !== 'image/webp') {
      try {
        // First compress the image
        const compressedFile = await compressImage(file, {
          quality: 0.9, // Higher quality for WebP conversion
          maxWidth: bucket === 'avatars' ? 500 : 1920,
          maxHeight: bucket === 'avatars' ? 500 : 1080,
          convertSize: Infinity // Don't auto-convert to JPEG
        });
        
        // Then convert to WebP
        processedFile = await convertToWebP(compressedFile, 0.85);
      } catch (webpError) {
        console.warn('WebP conversion failed, falling back to standard compression:', webpError);
        // Fallback to standard compression
        processedFile = await compressImage(file, {
          quality: 0.8,
          maxWidth: bucket === 'avatars' ? 500 : 1920,
          maxHeight: bucket === 'avatars' ? 500 : 1080,
          convertSize: 1000000
        });
      }
    } else {
      // Standard compression for non-WebP browsers or already WebP files
      processedFile = await compressImage(file, {
        quality: 0.8,
        maxWidth: bucket === 'avatars' ? 500 : 1920,
        maxHeight: bucket === 'avatars' ? 500 : 1080,
        convertSize: 1000000
      });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${processedFile.type === 'image/webp' ? 'webp' : fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, processedFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`Error uploading to ${bucket}:`, error);
    return null;
  }
}