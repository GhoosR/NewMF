import React, { useState } from 'react';
import { X, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface EditGroupChatProps {
  conversationId: string;
  currentName: string;
  currentImage?: string;
  onClose: () => void;
  onSuccess: (newName: string, newImage: string) => void;
}

export function EditGroupChat({ 
  conversationId, 
  currentName, 
  currentImage,
  onClose, 
  onSuccess 
}: EditGroupChatProps) {
  const [name, setName] = useState(currentName);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImage);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let imageUrl = currentImage;
      if (image) {
        try {
          const fileName = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = `${user.id}/${fileName}`;
          
          const { data: imageData, error: imageError } = await supabase.storage
            .from('group-chat-images')
            .upload(filePath, image, {
              cacheControl: '3600',
              upsert: true
            });

          if (imageError) {
            console.error('Error uploading image:', imageError);
            setError('Failed to upload group image. Please try again.');
            return;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('group-chat-images')
            .getPublicUrl(imageData.path);

          imageUrl = publicUrl;
        } catch (err: any) {
          console.error('Storage error:', err);
          setError('Failed to upload group image. Please try again.');
          return;
        }
      }

      // Update conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          name: name.trim(),
          image_url: imageUrl
        })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      onSuccess(name.trim(), imageUrl || '');
      onClose();
    } catch (err: any) {
      console.error('Error updating group:', err);
      setError(err.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Edit Group</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Group Image */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="group-image"
              />
              <label
                htmlFor="group-image"
                className="absolute bottom-0 right-0 p-1 bg-accent-text text-white rounded-full cursor-pointer hover:bg-accent-text/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </label>
            </div>
          </div>

          {/* Group Name */}
          <div>
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-text/20 focus:border-accent-text"
              placeholder="Enter group name"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}









