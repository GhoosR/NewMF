import React from 'react';
import { Camera } from 'lucide-react';
import { uploadImage } from '../../lib/storage';
import { updateProfile } from '../../lib/profile';

interface ProfileBannerProps {
  bannerUrl?: string;
  userId: string;
  onUpdate: () => void;
  isEditable: boolean;
}

export function ProfileBanner({ bannerUrl, userId, onUpdate, isEditable }: ProfileBannerProps) {
  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const publicUrl = await uploadImage(file, 'banners');
      if (!publicUrl) return;

      await updateProfile(userId, { banner_url: publicUrl });
      onUpdate();
    } catch (error) {
      console.error('Error updating banner:', error);
    }
  };

  return (
    <div className="relative h-48">
      <div className="h-full w-full bg-gradient-to-r from-blue-400 to-indigo-500 overflow-hidden rounded-lg">
        {bannerUrl && (
          <img 
            src={bannerUrl} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
          />
        )}
      </div>
      {isEditable && (
        <label className="absolute bottom-4 right-4 bg-white rounded-full p-2 cursor-pointer shadow-lg">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleBannerUpload}
          />
          <Camera className="h-5 w-5 text-gray-500" />
        </label>
      )}
    </div>
  );
}