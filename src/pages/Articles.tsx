import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { ArticleCard } from '../components/Articles/ArticleCard';
import { ArticleForm } from '../components/Articles/ArticleForm';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../lib/hooks/useAdmin';

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

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: string;
  featured_image?: string;
  tags?: string[];
  view_count: number;
  featured: boolean;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export function Articles() {
  const { isAdmin } = useAdmin();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          user:users!articles_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const featuredArticles = filteredArticles.filter(article => article.featured);
  const regularArticles = filteredArticles.filter(article => !article.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Meta 
        title="Wellness Articles & Insights | Mindful Family"
        description="Discover expert insights on wellness, mindfulness, nutrition, and sustainable living. Read our latest articles and guides."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-gelica font-bold text-content mb-2">Articles & Insights</h1>
          <p className="text-content/70">
            Discover expert insights on wellness, mindfulness, and sustainable living
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Article
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-12 pr-8 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 appearance-none min-w-[200px]"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-content/60 text-lg">
            {searchQuery || selectedCategory ? 'No articles found matching your criteria.' : 'No articles available yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-content mb-6">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {featuredArticles.map(article => (
                  <ArticleCard key={article.id} article={article} featured />
                ))}
              </div>
            </section>
          )}

          {/* Regular Articles */}
          {regularArticles.length > 0 && (
            <section>
              {featuredArticles.length > 0 && (
                <h2 className="text-2xl font-semibold text-content mb-6">Latest Articles</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {regularArticles.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateModal && (
        <ArticleForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchArticles();
          }}
        />
      )}
    </div>
  );
}