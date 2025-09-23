import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { ArticleForm } from '../Articles/ArticleForm';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils/dateUtils';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  read_time: string;
  published: boolean;
  featured: boolean;
  view_count: number;
  created_at: string;
  user?: {
    username: string;
  };
}

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const fetchArticles = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          user:users!articles_user_id_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false });

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
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchArticles();
    } catch (err: any) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article');
    }
  };

  const togglePublished = async (id: string, published: boolean) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ published: !published })
        .eq('id', id);

      if (error) throw error;
      await fetchArticles();
    } catch (err: any) {
      console.error('Error updating article:', err);
      alert('Failed to update article');
    }
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ featured: !featured })
        .eq('id', id);

      if (error) throw error;
      await fetchArticles();
    } catch (err: any) {
      console.error('Error updating article:', err);
      alert('Failed to update article');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-content">Articles</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Article
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {article.title}
                        </div>
                        {article.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{article.user?.username || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-accent-base/20 text-accent-text">
                      {article.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => togglePublished(article.id, article.published)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        article.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {article.published ? (
                        <>
                          <Eye className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.view_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(article.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFeatured(article.id, article.featured)}
                        className={`p-1 rounded ${
                          article.featured ? 'text-yellow-600' : 'text-gray-400 hover:text-yellow-600'
                        }`}
                        title={article.featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="text-accent-text hover:text-accent-text/80"
                        title="Edit article"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete article"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingArticle) && (
        <ArticleForm
          article={editingArticle}
          onClose={() => {
            setShowCreateModal(false);
            setEditingArticle(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingArticle(null);
            fetchArticles();
          }}
        />
      )}
    </div>
  );
}