import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils/dateUtils';
import { Meta } from '../components/Meta';
import { formatCategoryName } from '../lib/utils/formatters';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: string;
  image_url: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  user: {
    username: string;
    avatar_url?: string;
  };
}

function processInlineMarkdown(text: string) {
  // Process links first
  let processed = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-accent-text hover:underline">$1</a>');
  
  // Then process bold (**word**)
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Then process italic (*word*)
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  return processed;
}

function renderContent(content: string) {
  // Handle empty or null content
  if (!content || content.trim() === '') {
    return <p className="text-content/70">No content available.</p>;
  }

  // Split content into blocks by double newlines
  const blocks = content.split(/\n\s*\n/);
  
  return blocks.map((block, blockIndex) => {
    // Skip empty blocks
    if (!block.trim()) {
      return null;
    }
    
    // Process each block separately
    const lines = block.split('\n');
    
    // Handle headings
    const h1Match = lines[0].match(/^#\s+(.+)$/);
    if (h1Match) {
      return (
        <h1 key={`block-${blockIndex}`} className="text-4xl font-bold text-content mt-12 mb-8">
          {h1Match[1]}
        </h1>
      );
    }

    const h2Match = lines[0].match(/^##\s+(.+)$/);
    if (h2Match) {
      return (
        <h2 key={`block-${blockIndex}`} className="text-3xl font-bold text-content mt-10 mb-6">
          {h2Match[1]}
        </h2>
      );
    }

    const h3Match = lines[0].match(/^###\s+(.+)$/);
    if (h3Match) {
      return (
        <h3 key={`block-${blockIndex}`} className="text-2xl font-bold text-content mt-8 mb-4">
          {h3Match[1]}
        </h3>
      );
    }

    const h4Match = lines[0].match(/^####\s+(.+)$/);
    if (h4Match) {
      return (
        <h4 key={`block-${blockIndex}`} className="text-xl font-bold text-content mt-6 mb-3">
          {h4Match[1]}
        </h4>
      );
    }

    // Handle bullet points and numbered lists
    if (lines.some(line => line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/))) {
      const isOrdered = lines.some(line => line.match(/^\d+\.\s+(.+)$/));
      const ListComponent = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered ? 'list-decimal pl-6 mb-6' : 'list-disc pl-6 mb-6';
      
      return (
        <ListComponent key={`block-${blockIndex}`} className={listClass}>
          {lines.map((line, lineIndex) => {
            const bulletMatch = line.match(/^[-*]\s+(.+)$/);
            const numberMatch = line.match(/^\d+\.\s+(.+)$/);
            
            if (bulletMatch) {
              return (
                <li key={`line-${lineIndex}`} className="text-lg text-content/80 mb-2" 
                    dangerouslySetInnerHTML={{ __html: processInlineMarkdown(bulletMatch[1]) }} />
              );
            }
            
            if (numberMatch) {
              return (
                <li key={`line-${lineIndex}`} className="text-lg text-content/80 mb-2" 
                    dangerouslySetInnerHTML={{ __html: processInlineMarkdown(numberMatch[1]) }} />
              );
            }
            
            return null;
          }).filter(Boolean)}
        </ListComponent>
      );
    }

    // Handle blockquotes
    if (lines[0].match(/^>\s+(.+)$/)) {
      const quoteText = lines.map((line, i) => {
        const quoteMatch = line.match(/^>\s+(.+)$/);
        return quoteMatch ? quoteMatch[1] : line;
      }).join('\n');
      
      return (
        <blockquote key={`block-${blockIndex}`} className="border-l-4 border-accent-text pl-4 my-6 italic text-lg text-content/80">
          <div dangerouslySetInnerHTML={{ __html: processInlineMarkdown(quoteText) }} />
        </blockquote>
      );
    }

    // Handle images
    const imageMatch = lines[0].match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      return (
        <div key={`block-${blockIndex}`} className="my-8">
          <img src={imageMatch[2]} alt={imageMatch[1]} className="rounded-lg w-full shadow-sm" />
          {imageMatch[1] && (
            <p className="text-sm text-content/60 text-center mt-2 italic">{imageMatch[1]}</p>
          )}
        </div>
      );
    }

    // Regular paragraphs - process inline markdown and handle line breaks
    const blockText = lines.join('\n').trim();
    
    return (
      <p 
        key={`block-${blockIndex}`} 
        className="mb-6 text-lg text-content/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processInlineMarkdown(blockText) }}
      />
    );
  });
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        const { data, error: fetchError } = await supabase
          .from('blog_posts')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('slug', slug)
          .eq('approval_status', 'approved')
          .single();

        if (fetchError) throw fetchError;
        setPost(data);
      } catch (err: any) {
        console.error('Error fetching post:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/blogs"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to blogs
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Post not found'}
          </h2>
          <Link 
            to="/articles" 
            className="text-accent-text hover:text-accent-text/80"
          >
            Back to articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Meta 
        title={post.meta_title || post.title}
        description={post.meta_description || post.excerpt}
        image={post.image_url}
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

        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-[400px] object-cover"
          />
          
          <div className="p-8">
            <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-content/60">
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

            <h1 className="text-4xl font-bold text-content mb-6">
              {post.title}
            </h1>

            <div className="prose max-w-none">
              {renderContent(post.content)}
            </div>
          </div>
        </article>
      </div>
    </>
  );
}