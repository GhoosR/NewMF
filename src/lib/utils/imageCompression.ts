import Compressor from 'compressorjs';

interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  convertSize?: number;
  success?: (result: File) => void;
  error?: (err: any) => void;
}

export function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  return new Promise((resolve, reject) => {
    // If the file is not an image, return it as is
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file, skipping compression:', file.type);
      resolve(file);
      return;
    }
    
    new Compressor(file, {
      quality: options.quality || 0.8,
      maxWidth: options.maxWidth || 800,
      maxHeight: options.maxHeight || 800,
      convertSize: options.convertSize || 1000000, // Convert to JPEG if > 1MB
      mimeType: 'auto',
      strict: false,
      checkOrientation: true,
      retainExif: false, // Remove EXIF data to reduce size
      error: (err) => {
        console.error('Image compression error:', err);
        options.error?.(err);
        // If compression fails, resolve with original file instead of rejecting
        console.warn('Falling back to original file due to compression error');
        resolve(file);
      },
      success: (result) => {
        // Create a new File object from the compressed Blob
        const compressedFile = new File([result], file.name, {
          type: result.type,
          lastModified: Date.now(),
        });
        const compressionRatio = (1 - (compressedFile.size / file.size)) * 100;
        if (compressionRatio < 0) {
          // If compression actually increased file size, return original
          resolve(file);
          return;
        }
        options.success?.(compressedFile);
        resolve(compressedFile);
      },
    });
  });
}