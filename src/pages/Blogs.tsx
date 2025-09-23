import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils/dateUtils';
import { Meta } from '../components/Meta';
import { formatCategoryName } from '../lib/utils/formatters';

const categories = [
  { value: 'ecovillage', label: 'Ecovillage' },
  { value: 'foraging', label: 'Foraging' },
  { value: 'guides', label: 'Guides' },
  { value: 'health', label: 'Health' },
  { value: 'interviews', label: 'Interviews' },
  { value: 'offgrid', label: 'Off-grid' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'permaculture', label: 'Permaculture' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'wellness', label: 'Wellness' }
];

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  read_time: string;
  image_url: string;
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

export function Blogs() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      try {
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved')
          .order('created_at', { ascending: false });

        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setPosts(data || []);
      } catch (err: any) {
        console.error('Error fetching posts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [selectedCategory]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Meta 
        title="Articles"
        description="Explore our collection of wellness articles on mindful living, holistic health, and sustainable practices."
      />

      <h1 className="text-3xl font-gelica font-bold text-content mb-8">Articles</h1>

      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 placeholder:text-content/40"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !selectedCategory
                ? 'bg-accent-text text-white'
                : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category.value
                  ? 'bg-accent-text text-white'
                  : 'bg-accent-base/20 text-content hover:bg-accent-base/30'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-red-600 mb-8">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-content/60">No articles found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <Link
              key={post.id}
              to={`/blogs/${post.slug}`}
              className="group bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-content/60">
                  <span className="px-3 py-1 bg-accent-base/20 text-accent-text rounded-full">
                    {formatCategoryName(post.category)}
                  </span>
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {post.user.username}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(post.created_at)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {post.read_time}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-content mb-2 group-hover:text-accent-text transition-colors">
                  {post.title}
                </h2>
                <p className="text-content/70 line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}