import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { compressImage } from '../../../../lib/utils/imageCompression';

interface FileInputProps {
  label: string;
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  multiple?: boolean;
  description?: string;
}

export function FileInput({
  label,
  onChange,
  maxFiles = 1, 
  maxSize = Infinity, // Changed from a fixed size to Infinity to remove the restriction
  accept,
  multiple = false,
  description,
}: FileInputProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [compressing, setCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setError('');
    const fileArray = Array.from(files);
    
    if (fileArray.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} ${maxFiles === 1 ? 'file' : 'files'} allowed`);
      return;
    }

    // Only check file size if maxSize is not Infinity
    if (maxSize !== Infinity) {
      const invalidFiles = fileArray.filter(file => file.size > maxSize * 1024 * 1024);
      if (invalidFiles.length > 0) {
        setError(`Files must be smaller than ${maxSize}MB`);
        return;
      }
    }

    setCompressing(true);
    // Compress images before adding them
    // Note: This handles HEIC/HEIF files from iPhones and automatically converts them
    const compressedFiles = await Promise.all(
      fileArray.map(async (file) => {
        const isHEIC = file.name.toLowerCase().endsWith('.heic') || 
                       file.name.toLowerCase().endsWith('.heif') ||
                       file.type === 'image/heic' || 
                       file.type === 'image/heif';
        
        if (file.type.startsWith('image/') || isHEIC) {
          // Determine compression settings based on file size
          const fileSizeMB = file.size / 1024 / 1024;
          let quality = 0.7;
          let maxWidth = 1080;
          let maxHeight = 1080;
          
          // More aggressive compression for larger files
          if (fileSizeMB > 10) {
            quality = 0.5;
            maxWidth = 800;
            maxHeight = 800;
          } else if (fileSizeMB > 5) {
            quality = 0.6;
            maxWidth = 900;
            maxHeight = 900;
          }
          
          return compressImage(file, {
            quality: quality,
            maxWidth: maxWidth,
            maxHeight: maxHeight,
            convertSize: 2000000, // Convert to JPG if > 2MB
            success: (result) => {
              console.log('Original size:', file.size / 1024 / 1024, 'MB');
              console.log('Compressed size:', result.size / 1024 / 1024, 'MB');
              console.log('Compression ratio:', ((1 - result.size / file.size) * 100).toFixed(1) + '%');
              return result;
            },
            error: (err) => {
              console.error('Compression error:', err);
              return file;
            }
          });
        }
        return file;
      })
    );
    setCompressing(false);

    const newFiles = [...selectedFiles, ...compressedFiles];
    setSelectedFiles(newFiles);
    onChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onChange(newFiles);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="text-gray-500">Drag and drop or </span>
            <button
              type="button"
              className="text-indigo-600 hover:text-indigo-500"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          {maxSize !== Infinity && (
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size: {maxSize}MB
            </p>
          )}
        </div>
        {compressing && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-text"></div>
            <span className="ml-2 text-sm text-content/60">Compressing images...</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {selectedFiles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-600 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}