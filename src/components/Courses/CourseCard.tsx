import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookOpen, Globe } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { StatusIndicator } from '../StatusIndicator';
import { formatPrice } from '../../lib/utils/formatters';
import { formatCategoryName } from '../../lib/utils/formatters';
import type { Course } from '../../types/courses';

interface CourseCardProps {
  course: Course;
  showStatus?: boolean;
}

export function CourseCard({ course, showStatus = false }: CourseCardProps) {
  // Calculate total duration from lessons if available
  const totalDuration = course.lessons?.reduce((acc, lesson) => acc + lesson.duration, 0) || 0;
  
  // Get lesson count from _count or lessons array
  const lessonCount = course._count?.lessons || course.lessons?.length || 0;

  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/courses/${course.id}`}>
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400'}
            alt={course.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {course.user && (
            <Link 
              to={`/profile/${course.user_id}/listings`}
              className="flex items-center space-x-2 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar 
                url={course.user.avatar_url} 
                size="sm"
                userId={course.user_id}
                editable={false}
              />
              <Username 
                username={course.user.username || 'Anonymous'}
                userId={course.user_id}
                className="text-sm text-content group-hover:text-accent-text"
              />
            </Link>
          )}
          {showStatus && course.approval_status && (
            <StatusIndicator status={course.approval_status} />
          )}
        </div>

        <Link to={`/courses/${course.id}`}>
          <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
            {course.title}
          </h3>
        </Link>

        <p className="text-content/80 line-clamp-2 mb-4">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-sm text-content/60">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
            </span>
            {totalDuration > 0 && (
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatCategoryName(course.category)}
              </span>
            )}
            <span className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              {course.language.toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-accent-text">
            {course.price > 0 ? formatPrice(course.price, course.currency) : 'Free'}
          </span>
        </div>
      </div>
    </div>
  );
}