import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, AlertTriangle, Loader2, Leaf, Info, Heart, Skull, Sprout, Flower2, XCircle, LogIn, CheckCircle, Droplets } from 'lucide-react';
import { Meta } from '../../components/Meta';
import { identifyPlant } from '../../lib/services/claudeService';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/utils/imageCompression';
import { Auth } from '../../components/Auth';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    if (!isAuthenticated) {
      setShowAuthModal(true);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (dailyAttempts >= 3) {
      setError('Daily limit reached. You can analyze up to 3 plants per day.');
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Clean up previous image URL if it exists
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
    }

    try {
      // Create image URL first for preview
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // Compress image before processing
      let processedFile = file;
      try {
        // Check if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (!isMobile) {
          // Only compress on desktop
          processedFile = await compressImage(file, {
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
            success: (result) => {
              console.log('Original size:', file.size / 1024 / 1024, 'MB');
              console.log('Compressed size:', result.size / 1024 / 1024, 'MB');
              return result;
            },
            error: (err) => {
              console.error('Compression error:', err);
              return file;
            }
          });
        }
      } catch (compressionErr) {
        console.error('Failed to compress image:', compressionErr);
      }

      const reader = new FileReader();
      reader.readAsDataURL(processedFile);
      
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result as string;
          if (!base64Image) {
            throw new Error('Failed to convert image to base64. Please try again with a different image.');
          }
          
          const { content, confidence } = await identifyPlant(base64Image);
          if (!content || content.isPlant === undefined) {
            throw new Error('Failed to analyze image. Please try again with a clearer photo.');
          }
          setResult({ ...content, confidence });
          setLoading(false);
          setDailyAttempts(prev => prev + 1);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the input
          }
        } catch (err: any) {
          console.error('Error processing image:', err);
          setError(err.message || 'Failed to process image. Please try again.');
          if (selectedImage) {
            URL.revokeObjectURL(selectedImage);
          }
          setSelectedImage(null);
          setLoading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear the input
          }
        }
      };
    } catch (err: any) {
      console.error('Error handling file:', err);
      setError(err.message || 'Failed to process image. Please try again.');
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTakePhoto = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (dailyAttempts >= 3) {
      setError('Daily limit reached. You can analyze up to 3 plants per day.');
      return;
    }
    if (fileInputRef.current) {
      // Don't use capture attribute on mobile as it can cause issues
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (dailyAttempts >= 3) {
      setError('Daily limit reached. You can analyze up to 3 plants per day.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.click();
    }
  };