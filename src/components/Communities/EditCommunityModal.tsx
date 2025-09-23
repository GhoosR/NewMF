import React, { useState } from 'react';
import { Modal } from '../Modal';
import { TextArea } from '../Listings/Forms/FormComponents/TextArea';
import { FileInput } from '../Listings/Forms/FormComponents/FileInput';
import { supabase } from '../../lib/supabase';
import type { Community } from '../../types/communities';

interface EditCommunityModalProps {
  community: Community;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCommunityModal({ community, onClose, onSuccess }: EditCommunityModalProps) {
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description || '',
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload new images if provided
      let avatarUrl = community.avatar_url;
      let bannerUrl = community.banner_url;

      if (avatar) {
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from('community-images')
          .upload(`${user.id}/${Date.now()}-avatar`, avatar);
        
        if (avatarError) throw avatarError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(avatarData.path);
        
        avatarUrl = publicUrl;
      }

      if (banner) {
        const { data: bannerData, error: bannerError } = await supabase.storage
          .from('community-images')
          .upload(`${user.id}/${Date.now()}-banner`, banner);
        
        if (bannerError) throw bannerError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-images')
          .getPublicUrl(bannerData.path);
        
        bannerUrl = publicUrl;
      }

      // Update community
      const { error: updateError } = await supabase
        .from('communities')
        .update({
          name: formData.name,
          description: formData.description,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq('id', community.id);

      if (updateError) throw updateError;
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Community" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-content">Community Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-accent-text/20 shadow-sm focus:border-accent-text focus:ring focus:ring-accent-text/20 bg-background"
            placeholder="Enter community name"
          />
        </div>

        <TextArea
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
          placeholder="Describe your community..."
          required
        />

        <FileInput
          label="Community Avatar"
          onChange={(files) => setAvatar(files[0])}
          maxFiles={1}
          maxSize={2}
          accept="image/*"
          description="Upload a profile picture for your community"
        />

        <FileInput
          label="Community Banner"
          onChange={(files) => setBanner(files[0])}
          maxFiles={1}
          maxSize={2}
          accept="image/*"
          description="Upload a banner image for your community"
        />

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}