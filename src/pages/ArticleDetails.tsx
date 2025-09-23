import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, Eye, Tag, Edit, Trash2, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { ArticleForm } from '../components/Articles/ArticleForm';
import { formatDate } from '../lib/utils/dateUtils';
import { formatCategoryName } from '../lib/utils/formatters';
import { Meta } from '../components/Meta';
import { useAdmin } from '../lib/hooks/useAdmin';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  featured_image?: string;
  tags?: string[];
  view_count: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export function ArticleDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchArticle() {
      if (!slug) return;

      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select(`
            *,
            user:users!articles_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Article not found');

        setArticle(data);

        // Increment view count
        await supabase
          .from('articles')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', data.id);

      } catch (err: any) {
        console.error('Error fetching article:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchArticle();
  }, [slug]);

  const handleDelete = async () => {
    if (!article || !window.confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', article.id);

      if (error) throw error;
      navigate('/articles');
    } catch (err: any) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const renderContent = (content: string) => {
    if (!content?.trim()) {
      return <p className="text-content/70">No content available.</p>;
    }

    // Split content into blocks by double newlines, but preserve single newlines within blocks
    const blocks = content.split(/\n\s*\n/).filter(block => block.trim());
    
    return blocks.map((block, blockIndex) => {
      if (!block.trim()) return null;
      
      const trimmedBlock = block.trim();
      const lines = trimmedBlock.split('\n');
      
      // Headings
      const h1Match = lines[0].match(/^#\s+(.+)$/);
      if (h1Match) {
        return (
          <h1 key={blockIndex} className="text-4xl font-bold text-content mt-12 mb-8">
            {h1Match[1]}
          </h1>
        );
      }

      const h2Match = lines[0].match(/^##\s+(.+)$/);
      if (h2Match) {
        return (
          <h2 key={blockIndex} className="text-3xl font-bold text-content mt-10 mb-6">
            {h2Match[1]}
          </h2>
        );
      }

      const h3Match = lines[0].match(/^###\s+(.+)$/);
      if (h3Match) {
        return (
          <h3 key={blockIndex} className="text-2xl font-bold text-content mt-8 mb-4">
            {h3Match[1]}
          </h3>
        );
      }

      const h4Match = lines[0].match(/^####\s+(.+)$/);
      if (h4Match) {
        return (
          <h4 key={blockIndex} className="text-xl font-bold text-content mt-6 mb-3">
            {h4Match[1]}
          </h4>
        );
      }

      const h5Match = lines[0].match(/^#####\s+(.+)$/);
      if (h5Match) {
        return (
          <h5 key={blockIndex} className="text-lg font-bold text-content mt-4 mb-2">
            {h5Match[1]}
          </h5>
        );
      }

      const h6Match = lines[0].match(/^######\s+(.+)$/);
      if (h6Match) {
        return (
          <h6 key={blockIndex} className="text-base font-bold text-content mt-3 mb-2">
            {h6Match[1]}
          </h6>
        );
      }

      // Images
      const imageMatch = lines[0].match(/!\[(.*?)\]\((.*?)\)/);
      if (imageMatch) {
        return (
          <div key={blockIndex} className="my-8">
            <img 
              src={imageMatch[2]} 
              alt={imageMatch[1]} 
              className="rounded-lg w-full shadow-sm" 
            />
            {imageMatch[1] && (
              <p className="text-sm text-content/60 text-center mt-2 italic">{imageMatch[1]}</p>
            )}
          </div>
        );
      }

      // Lists
      if (lines.some(line => line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/))) {
        const isOrdered = lines.some(line => line.match(/^\d+\.\s+(.+)$/));
        const ListComponent = isOrdered ? 'ol' : 'ul';
        const listClass = isOrdered ? 'list-decimal pl-6 mb-6' : 'list-disc pl-6 mb-6';
        
        return React.createElement(ListComponent, {
          key: blockIndex,
          className: listClass
        }, lines.map((line, lineIndex) => {
          const bulletMatch = line.match(/^[-*]\s+(.+)$/);
          const numberMatch = line.match(/^\d+\.\s+(.+)$/);
          
          if (bulletMatch || numberMatch) {
            const text = bulletMatch ? bulletMatch[1] : numberMatch![1];
            return React.createElement('li', {
              key: lineIndex,
              className: 'text-lg text-content/80 mb-2',
              dangerouslySetInnerHTML: { __html: processInlineMarkdown(text) }
            });
          }
          return null;
        }).filter(Boolean));
      }

      // Blockquotes
      if (lines[0].match(/^>\s+(.+)$/)) {
        const quoteText = lines.map(line => {
          const match = line.match(/^>\s+(.+)$/);
          return match ? match[1] : line;
        }).join('\n');
        
        return (
          <blockquote key={blockIndex} className="border-l-4 border-accent-text pl-4 my-6 italic text-lg text-content/80">
            <div dangerouslySetInnerHTML={{ __html: processInlineMarkdown(quoteText) }} />
          </blockquote>
        );
      }

      // Code blocks
      if (lines[0].match(/^```/)) {
        const codeContent = lines.slice(1, -1).join('\n');
        return (
          <pre key={blockIndex} className="bg-gray-100 rounded-lg p-4 overflow-x-auto my-6">
            <code className="text-sm">{codeContent}</code>
          </pre>
        );
      }

      // Regular paragraphs
      const paragraphContent = trimmedBlock.replace(/\n/g, '<br />');
      return (
        <p 
          key={blockIndex} 
          className="mb-6 text-lg text-content/80 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processInlineMarkdown(paragraphContent) }}
        />
      );
    });
  };

  const processInlineMarkdown = (text: string) => {
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent-text hover:underline" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/articles"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to articles
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Article not found'}
          </h2>
          <Link 
            to="/articles" 
            className="text-accent-text hover:text-accent-text/80"
          >
            Browse all articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Meta 
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt}
        image={article.featured_image}
        type="article"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/articles"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to articles
        </Link>

        <article className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Featured Image */}
          {article.featured_image && (
            <div className="relative h-64 sm:h-96 overflow-hidden">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
          
          <div className="p-8">
            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 bg-accent-base/20 text-accent-text rounded-full text-sm font-medium">
                {formatCategoryName(article.category)}
              </span>
              <div className="flex items-center space-x-4 text-sm text-content/60">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(article.created_at)}
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {article.read_time}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {article.view_count} views
                </span>
              </div>
            </div>

            {/* Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
              <h1 className="text-4xl font-bold text-content leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleShare}
                  className="p-2 text-content/60 hover:text-accent-text rounded-full hover:bg-accent-base/10 transition-colors"
                  title="Share article"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="p-2 text-content/60 hover:text-accent-text rounded-full hover:bg-accent-base/10 transition-colors"
                      title="Edit article"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 text-content/60 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Author Info */}
            <div className="flex items-center space-x-4 pb-8 mb-8 border-b border-accent-text/10">
              <Avatar 
                url={article.user?.avatar_url} 
                size="md"
                username={article.user?.username || 'Unknown'}
                editable={false}
              />
              <div>
                <Username 
                  username={article.user?.username || 'Unknown'}
                  className="text-lg font-medium text-content"
                />
                <p className="text-content/60">Article Author</p>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              {renderContent(article.content)}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-accent-text/10">
                <h3 className="text-lg font-medium text-content mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-accent-base/20 text-accent-text rounded-full text-sm"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Edit Modal */}
        {showEditModal && (
          <ArticleForm
            article={article}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => {
              setShowEditModal(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    </>
  );
}