import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Type, CheckCircle, Lock, BookOpen, Clock, Globe, ListOrdered, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { Auth } from '../components/Auth';
import { CourseForm } from '../components/Courses/CourseForm';
import { formatPrice } from '../lib/utils/formatters';
import { formatCategoryName } from '../lib/utils/formatters';
import type { Course } from '../types/courses';

export function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isOwnCourse, setIsOwnCourse] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Check enrollment if user is logged in
        if (currentUser) {
          const { data: enrollment } = await supabase
            .from('course_enrollments')
            .select('status')
            .eq('course_id', id)
            .eq('user_id', currentUser.id)
            .maybeSingle();

          setIsEnrolled(enrollment?.status === 'active');
        }

        // Fetch course with lessons
        const { data, error: fetchError } = await supabase
          .from('courses')
          .select(`
            *,
            lessons (
              id,
              title,
              description,
              duration,
              order_number,
              type
            ),
            user:users (
              id,
              username,
              avatar_url,
              verified
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Course not found');

        setCourse(data);
        setIsOwnCourse(currentUser?.id === data.user_id);
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      navigate('/courses');
    } catch (err: any) {
      console.error('Error deleting course:', err);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleEnrollment = async () => {
    if (!course || !id) return;

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (course.price > 0) {
        alert('Payment processing will be implemented soon');
        return;
      }

      // For free courses, create enrollment directly
      const { error: enrollError } = await supabase
        .from('course_enrollments')
        .insert([{
          user_id: user.id,
          course_id: id,
          status: 'active',
          amount: 0,
          currency: course.currency
        }]);

      if (enrollError) throw enrollError;

      setIsEnrolled(true);
      navigate(`/courses/${id}/learn`);
    } catch (err: any) {
      console.error('Error enrolling in course:', err);
      alert('Failed to enroll in course. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/courses"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to courses
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Course not found'}
          </h2>
          <Link 
            to="/courses" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all courses
          </Link>
        </div>
      </div>
    );
  }

  const totalDuration = course.lessons?.reduce((acc, lesson) => acc + lesson.duration, 0) || 0;
  const lessonCount = course.lessons?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link 
        to="/courses"
        className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to courses
      </Link>

      <div className="bg-background rounded-lg shadow-sm overflow-hidden">
        <div className="relative h-64 sm:h-96">
          <img
            src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1920'}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            {course.user && (
              <Link 
                to={`/profile/${course.user.id}/listings`}
                className="flex items-center space-x-3 group"
              >
                <Avatar 
                  url={course.user.avatar_url} 
                  size="md"
                  userId={course.user.id}
                  editable={false}
                />
                <div>
                  <Username 
                    username={course.user.username || 'Anonymous'}
                    userId={course.user.id}
                    verified={course.user.verified}
                    className="block text-sm font-medium text-content group-hover:text-accent-text"
                  />
                  <span className="block text-sm text-content/60">
                    Course Creator
                  </span>
                </div>
              </Link>
            )}
            <div className="flex items-center space-x-3">
              {isOwnCourse ? (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text hover:bg-accent-base/10 rounded-md"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                </>
              ) : null}
              <span className="px-3 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                {formatCategoryName(course.category)}
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-content mb-4">{course.title}</h1>

          <div className="prose max-w-none mb-8">
            <p className="text-content/80 whitespace-pre-line">{course.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-accent-base/10 rounded-lg p-4">
              <h3 className="font-medium text-content mb-2 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-accent-text" />
                Duration
              </h3>
              <p className="text-content/80">{totalDuration} minutes total</p>
            </div>

            <div className="bg-accent-base/10 rounded-lg p-4">
              <h3 className="font-medium text-content mb-2 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-accent-text" />
                Lessons
              </h3>
              <p className="text-content/80">{lessonCount} lessons</p>
            </div>

            <div className="bg-accent-base/10 rounded-lg p-4">
              <h3 className="font-medium text-content mb-2 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-accent-text" />
                Language
              </h3>
              <p className="text-content/80">{course.language.toUpperCase()}</p>
            </div>
          </div>

          {course.lessons && course.lessons.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-content mb-4 flex items-center">
                <ListOrdered className="h-5 w-5 mr-2 text-accent-text" />
                Course Content
              </h2>
              <div className="space-y-2">
                {course.lessons.sort((a, b) => a.order_number - b.order_number).map((lesson, index) => (
                  <div 
                    key={lesson.id}
                    className={`p-4 rounded-lg ${
                      isEnrolled ? 'bg-accent-base/10' : 'bg-accent-base/5'
                    }`}
                  >
                    <div className="flex items-center">
                      {lesson.type === 'video' ? (
                        <Play className="h-4 w-4 mr-3 text-accent-text" />
                      ) : lesson.type === 'pdf' ? (
                        <FileText className="h-4 w-4 mr-3 text-accent-text" />
                      ) : (
                        <Type className="h-4 w-4 mr-3 text-accent-text" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-content">
                          {index + 1}. {lesson.title}
                        </h3>
                        <p className="text-sm text-content/60">
                          {lesson.duration} minutes
                        </p>
                      </div>
                      {!isEnrolled && (
                        <Lock className="h-4 w-4 text-content/40" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEnrolled && (
            <div className="flex justify-between items-center bg-accent-base/10 rounded-lg p-6">
              <div>
                <h3 className="text-xl font-semibold text-content mb-2">
                  Enroll in this course
                </h3>
                <p className="text-content/80">
                  {course.price > 0 
                    ? `Get access to all lessons for ${formatPrice(course.price, course.currency)}`
                    : 'This course is free! Enroll now to get started.'
                  }
                </p>
              </div>
              <button
                onClick={handleEnrollment}
                className="px-6 py-3 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
              >
                {course.price > 0 ? 'Purchase Course' : 'Start Learning'}
              </button>
            </div>
          )}

          {isEnrolled && (
            <div className="mt-8">
              <button
                onClick={() => navigate(`/courses/${course.id}/learn`)}
                className="w-full px-6 py-3 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
              >
                Continue Learning
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <CourseForm
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
      
      {showAuthModal && (
        <Auth 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
    </div>
  );
}