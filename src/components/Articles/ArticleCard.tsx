import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Calendar, Eye, Tag } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatDate } from '../../lib/utils/dateUtils';
import { formatCategoryName } from '../../lib/utils/formatters';

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

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <article className={`bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group ${
      featured ? 'lg:col-span-2' : ''
    }`}>
      <Link to={`/articles/${article.slug}`}>
        <div className={`relative overflow-hidden ${featured ? 'h-64 sm:h-80' : 'h-48'}`}>
          <img
            src={article.featured_image || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=800'}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {article.featured && (
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-accent-text text-white text-sm font-medium rounded-full">
                Featured
              </span>
            </div>
          )}
          
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-accent-text text-sm font-medium rounded-full">
              {formatCategoryName(article.category)}
            </span>
          </div>
        </div>
      </Link>
      
      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar 
            url={article.user?.avatar_url} 
            size="sm"
            username={article.user?.username || 'Anonymous'}
            editable={false}
          />
          <div className="flex-1 min-w-0">
            <Username 
              username={article.user?.username || 'Anonymous'}
              className="text-sm font-medium text-content group-hover:text-accent-text transition-colors"
            />
            <div className="flex items-center space-x-3 text-xs text-content/60">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(article.created_at)}
              </span>
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {article.read_time}
              </span>
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {article.view_count}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <Link to={`/articles/${article.slug}`}>
          <h2 className={`font-bold text-content mb-3 group-hover:text-accent-text transition-colors line-clamp-2 ${
            featured ? 'text-2xl' : 'text-xl'
          }`}>
            {article.title}
          </h2>
          <p className={`text-content/70 line-clamp-3 leading-relaxed ${
            featured ? 'text-base' : 'text-sm'
          }`}>
            {article.excerpt}
          </p>
        </Link>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-accent-base/20 text-accent-text rounded-full"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 text-xs bg-accent-base/20 text-accent-text rounded-full">
                +{article.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}