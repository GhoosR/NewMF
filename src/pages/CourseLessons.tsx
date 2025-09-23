import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Play, FileText, Type, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Course } from '../types/courses';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content_url: string;
  duration: number;
  order_number: number;
  type: 'video' | 'pdf' | 'text';
}

interface Progress {
  lesson_id: string;
  completed_at: string | null;
  watched_duration?: number;
  total_duration?: number;
}

export function CourseLessons() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourse() {
      if (!id) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        setUserId(user.id);

        // Check enrollment
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('course_enrollments')
          .select('status')
          .eq('course_id', id)
          .eq('user_id', user.id);

        if (enrollmentError) throw enrollmentError;
        
        const isActive = enrollments?.some(e => e.status === 'active') || false;
        setIsEnrolled(isActive);
        setEnrollmentChecked(true);

        if (!isActive) {
          setLoading(false);
          return;
        }

        // Fetch course and lessons
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            lessons (
              id,
              title,
              description,
              content_url,
              duration,
              order_number,
              type
            ),
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        if (!courseData) throw new Error('Course not found');
        
        setCourse(courseData);
        
        if (courseData.lessons) {
          const sortedLessons = courseData.lessons.sort((a, b) => a.order_number - b.order_number);
          
          // Get signed URLs for video content
          const lessonsWithSignedUrls = await Promise.all(
            sortedLessons.map(async (lesson) => {
              if (lesson.type === 'video' && lesson.content_url) {
                // Extract video ID from various YouTube URL formats
                const videoId = lesson.content_url.match(/(?:\/embed\/|watch\?v=|\/v\/|youtu\.be\/|\/v=|\/e\/|watch\?v%3D|watch\?feature=player_embedded&v=|%2Fvideos%2F|embed%\u200C\u200B2F|youtu.be%2F|v%2F)([^#\&\?\n]*)/);
                
                const embedUrl = videoId 
                  ? `https://www.youtube.com/embed/${videoId[1]}`
                  : lesson.content_url;
                
                return {
                  ...lesson,
                  content_url: embedUrl
                };
              }
              return lesson;
            })
          );
          
          setLessons(lessonsWithSignedUrls);
          
          // Get progress
          const { data: progressData } = await supabase
            .from('course_progress')
            .select('lesson_id, completed_at, watched_duration, total_duration')
            .eq('course_id', id)
            .eq('user_id', user.id);

          setProgress(progressData || []);

          // Set current lesson to first incomplete lesson, last in-progress lesson, or first lesson
          let lessonToShow = lessonsWithSignedUrls[0];
          
          // First check for incomplete lessons (no completed_at date)
          const firstIncomplete = lessonsWithSignedUrls.find(lesson => 
            !progressData?.some(p => p.lesson_id === lesson.id && p.completed_at)
          );
          
          if (firstIncomplete) {
            lessonToShow = firstIncomplete;
          } else {
            // If all lessons are complete, show the last one
            lessonToShow = lessonsWithSignedUrls[lessonsWithSignedUrls.length - 1];
          }
          
          setCurrentLesson(lessonToShow);
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [id]);

  const markLessonComplete = async (lessonId: string) => {
    try {
      if (!userId || !course) return;

      await supabase
        .from('course_progress')
        .upsert({
          user_id: userId,
          course_id: course.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          total_duration: currentLesson?.duration || 0,
          watched_duration: currentLesson?.duration || 0
        });

      // Update local progress
      setProgress(prev => [
        ...prev.filter(p => p.lesson_id !== lessonId),
        { 
          lesson_id: lessonId, 
          completed_at: new Date().toISOString(),
          watched_duration: currentLesson?.duration || 0,
          total_duration: currentLesson?.duration || 0
        }
      ]);

      // Move to next lesson if available
      const currentIndex = lessons.findIndex(l => l.id === lessonId);
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    }
  };

  // Track video progress
  const updateLessonProgress = async (lessonId: string, watchedDuration: number) => {
    try {
      if (!userId || !course) return;

      // Get the total duration from the lesson
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;

      const totalDuration = lesson.duration;

      // Update progress in database
      await supabase
        .from('course_progress')
        .upsert({
          user_id: userId,
          course_id: course.id,
          lesson_id: lessonId,
          watched_duration: watchedDuration,
          total_duration: totalDuration,
          // Only set completed_at if it's already completed or if watched >= total
          completed_at: watchedDuration >= totalDuration ? new Date().toISOString() : null
        });

      // Update local progress
      setProgress(prev => {
        const existingProgress = prev.find(p => p.lesson_id === lessonId);
        if (existingProgress) {
          return prev.map(p => p.lesson_id === lessonId ? {
            ...p,
            watched_duration: watchedDuration,
            total_duration: totalDuration,
            completed_at: watchedDuration >= totalDuration ? new Date().toISOString() : p.completed_at
          } : p);
        } else {
          return [...prev, {
            lesson_id: lessonId,
            watched_duration: watchedDuration,
            total_duration: totalDuration,
            completed_at: watchedDuration >= totalDuration ? new Date().toISOString() : null
          }];
        }
      });
    } catch (err) {
      console.error('Error updating lesson progress:', err);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed_at);
  };

  // Allow access to all lessons that are either:
  // 1. The first lesson
  // 2. Any lesson where the previous lesson is completed
  // 3. Any lesson that has progress already (user started it before)
  const isLessonAccessible = (lesson: Lesson) => {
    // First lesson is always accessible
    if (lesson.order_number === 1) return true;
    
    // Check if this lesson already has progress
    const hasProgress = progress.some(p => p.lesson_id === lesson.id);
    if (hasProgress) return true;
    
    // Check if previous lesson is completed
    const previousLesson = lessons.find(l => l.order_number === lesson.order_number - 1);
    if (previousLesson && isLessonCompleted(previousLesson.id)) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  // Only redirect if we've checked enrollment status
  if (enrollmentChecked && !isEnrolled) {
    return <Navigate to={`/courses/${id}`} replace />;
  }

  if (error || !course) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to={`/courses/${id}`}
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to course details
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Course not found'}
          </h2>
          <Link 
            to="/courses" 
            className="text-accent-text hover:text-accent-text/80"
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to={`/courses/${id}`}
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to course details
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {currentLesson && (
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-content mb-4">
                    {currentLesson.title}
                  </h1>
                  
                  <div className="prose max-w-none mb-6">
                    <p className="text-content/80">
                      {currentLesson.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    {currentLesson.type === 'video' ? (
                      <div className="aspect-video">
                        {currentLesson.content_url && (
                          <iframe
                            src={currentLesson.content_url}
                            className="w-full h-full rounded-lg"
                            title={currentLesson.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )}
                      </div>
                    ) : currentLesson.type === 'pdf' ? (
                      <iframe
                        src={currentLesson.content_url}
                        className="w-full h-[600px] rounded-lg"
                        title={currentLesson.title}
                      />
                    ) : (
                      <div className="bg-accent-base/10 rounded-lg p-6">
                        <div className="prose max-w-none">
                          {currentLesson.content_url}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-content/60">
                      Duration: {currentLesson.duration} minutes
                    </div>
                    {!isLessonCompleted(currentLesson.id) && (
                      <button
                        onClick={() => markLessonComplete(currentLesson.id)}
                        className="px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lesson List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-content mb-4">
              Course Progress
            </h2>
            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson.id);
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => isLessonAccessible(lesson) && setCurrentLesson(lesson)}
                    disabled={!isLessonAccessible(lesson)}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                      currentLesson?.id === lesson.id
                        ? 'bg-accent-text text-white'
                        : isCompleted
                        ? 'bg-accent-base/20 text-content'
                        : isLessonAccessible(lesson)
                        ? 'hover:bg-accent-base/10'
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex-1 flex items-center">
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 mr-3" />
                      ) : !isLessonAccessible(lesson) ? (
                        <Lock className="h-4 w-4 mr-3" />
                      ) : lesson.type === 'video' ? (
                        <Play className="h-4 w-4 mr-3" />
                      ) : lesson.type === 'pdf' ? (
                        <FileText className="h-4 w-4 mr-3" />
                      ) : (
                        <Type className="h-4 w-4 mr-3" />
                      )}
                      <div className="text-left">
                        <span className="block">{lesson.title}</span>
                        <span className="text-sm opacity-80">
                          {lesson.duration} mins
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseLessons;