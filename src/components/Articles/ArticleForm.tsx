import React, { useState } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { ArticleEditor } from './ArticleEditor';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/storage';

interface ArticleFormProps {
  onClose: () => void;
  onSuccess: () => void;
  article?: any;
}

const categories = [
  { value: 'wellness', label: 'Wellness' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'sustainability', label: 'Sustainability' },
    { value: 'permaculture', label: 'Permaculture' },
  { value: 'community', label: 'Community' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'health', label: 'Health' },
  { value: 'spirituality', label: 'Spirituality' }
];

export function ArticleForm({ onClose, onSuccess, article }: ArticleFormProps) {
  const [formData, setFormData] = useState({
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    category: article?.category || '',
    read_time: article?.read_time || '',
    tags: article?.tags?.join(', ') || '',
    meta_title: article?.meta_title || '',
    meta_description: article?.meta_description || '',
    featured: article?.featured || false
  });
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(article?.featured_image || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const imageUrl = await uploadImage(file, 'blog-images');
      if (!imageUrl) throw new Error('Failed to upload image');
      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload featured image if provided
      let imageUrl = currentImageUrl;
      if (featuredImage) {
        imageUrl = await uploadImage(featuredImage, 'blog-images');
      }

      // Auto-generate read time if not provided
      const readTime = formData.read_time || estimateReadTime(formData.content);

      // Prepare article data
      const articleData = {
        user_id: user.id,
        title: formData.title,
        slug: generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        read_time: readTime,
        featured_image: imageUrl,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.excerpt,
        featured: formData.featured,
        published: true // Auto-publish for admins
      };

      if (article) {
        // Update existing article
        const { error: updateError } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new article
        const { error: insertError } = await supabase
          .from('articles')
          .insert([articleData]);
        
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving article:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent-text/10">
          <h2 className="text-2xl font-semibold text-content">
            {article ? 'Edit Article' : 'Create New Article'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="Enter article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Excerpt *
              </label>
              <textarea
                required
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                rows={3}
                placeholder="Write a brief excerpt that summarizes your article..."
              />
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Featured Image
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFeaturedImage(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-content/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent-base/20 file:text-accent-text hover:file:bg-accent-base/30"
                />
                {(currentImageUrl || featuredImage) && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-accent-text/10">
                    <img
                      src={featuredImage ? URL.createObjectURL(featuredImage) : currentImageUrl}
                      alt="Featured image preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Content *
              </label>
              <ArticleEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                onImageUpload={handleImageUpload}
              />
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Read Time
                </label>
                <input
                  type="text"
                  value={formData.read_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, read_time: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="e.g., 5 min read (auto-calculated if empty)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="wellness, mindfulness, health (comma separated)"
                />
              </div>
            </div>

            {/* SEO Settings */}
            <div className="space-y-4 p-4 bg-accent-base/5 rounded-lg">
              <h3 className="text-lg font-medium text-content">SEO Settings</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-content mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    placeholder="SEO title (defaults to article title)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-content mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    rows={2}
                    placeholder="SEO description (defaults to excerpt)"
                  />
                </div>
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                className="rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
              />
              <label htmlFor="featured" className="text-sm font-medium text-content">
                Feature this article on the homepage
              </label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-accent-text/10 bg-accent-base/5">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-content hover:text-content/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (article ? 'Update Article' : 'Publish Article')}
          </button>
        </div>
      </div>
    </div>
  );
}