import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { FileInput } from '../Listings/Forms/FormComponents/FileInput';
import { supabase } from '../../lib/supabase';
import { compressImage } from '../../lib/utils/imageCompression';
import { uploadImage } from '../../lib/storage'; 
import type { Profile } from '../../lib/profile';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditProfileModal({ profile, onClose, onUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    username: profile.username,
    full_name: profile.full_name || '',
    bio: profile.bio || ''
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Only allow updating specific fields (not username)
      const updates: Partial<Profile> = {
        full_name: formData.full_name,
        bio: formData.bio,
        updated_at: new Date().toISOString()
      };

      // Upload new avatar if provided
      if (avatar) {
        // Compress image before uploading
        const compressedAvatar = await compressImage(avatar, {
          quality: 0.8,
          maxWidth: 500,
          maxHeight: 500,
          convertSize: 1000000 // Convert to JPG if > 1MB
        });
        
        const avatarUrl = await uploadImage(compressedAvatar, 'avatars');
        if (avatarUrl) updates.avatar_url = avatarUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      onUpdate();
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');

      // Call the delete_user function
      const { error: deleteError } = await supabase
        .rpc('delete_user', {
          user_id: profile.id
        });

      if (deleteError) {
        throw deleteError;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md m-0 sm:m-4 bg-white sm:rounded-lg flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-content">Edit Profile</h2>
            <button onClick={onClose} className="text-content/60 hover:text-content">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                title="Username cannot be changed"
              />
              <p className="mt-1 text-xs text-content/60">Username cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                rows={4}
              />
            </div>

            <FileInput
              label="Profile Picture"
              onChange={(files) => setAvatar(files[0])}
              maxFiles={1}
              maxSize={Infinity} // Remove size restriction for profile pictures
              accept="image/*"
              description="Upload a new profile picture (will be automatically compressed)"
            />

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete Account
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md m-4">
              <div className="flex items-start space-x-3 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Account</h3>
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data, including:
                  </p>
                  <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                    <li>Profile information</li>
                    <li>Posts and comments</li>
                    <li>Listings and courses</li>
                    <li>Messages and notifications</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}