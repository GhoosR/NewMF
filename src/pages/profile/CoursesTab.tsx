import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isProfessional } from '../../lib/auth/authService';
import { CourseForm } from '../../components/Courses/CourseForm';
import { CourseCard } from '../../components/Courses/CourseCard';
import type { Course } from '../../types/courses';

interface CoursesTabProps {
  userId: string;
}

type TabType = 'created' | 'enrolled';

export function CoursesTab({ userId }: CoursesTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('created');
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCreateCourse, setCanCreateCourse] = useState(false);
  const [hasStripeConnect, setHasStripeConnect] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsOwnProfile(user?.id === userId);

        if (user?.id === userId) {
          const hasProfessionalAccess = await isProfessional();
          setCanCreateCourse(hasProfessionalAccess);

          if (hasProfessionalAccess) {
            const { data: userData } = await supabase
              .from('users')
              .select('stripe_connect_status')
              .eq('id', userId)
              .single();

            setHasStripeConnect(userData?.stripe_connect_status === 'connected');
          }
        }
      } catch (err) {
        console.error('Error checking access:', err);
      }
    };

    checkAccess();
  }, [userId]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Fetch created courses
        let createdQuery = supabase
          .from('courses')
          .select(`
            *,
            lessons (count),
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('user_id', userId);

        // If viewing someone else's profile, only show approved courses
        if (currentUser?.id !== userId) {
          createdQuery = createdQuery.eq('approval_status', 'approved');
        }

        const { data: created, error: createdError } = await createdQuery;
        if (createdError) throw createdError;
        setCreatedCourses(created || []);

        // Fetch enrolled courses if viewing own profile
        if (currentUser?.id === userId) {
          const { data: enrolled, error: enrolledError } = await supabase
            .from('course_enrollments')
            .select(`
              course:courses (
                *,
                lessons (count),
                user:users (
                  username,
                  avatar_url
                )
              )
            `)
            .eq('user_id', userId)
            .eq('status', 'active');

          if (enrolledError) throw enrolledError;
          setEnrolledCourses(enrolled?.map(e => e.course) || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (!isOwnProfile) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-content">Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {createdCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              showStatus={false}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-content">Your Courses</h2>
        {canCreateCourse && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-text hover:bg-accent-text/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </button>
        )}
      </div>

      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {!hasStripeConnect && canCreateCourse && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">
            Note: You can create free courses now, but to create paid courses you'll need to connect your Stripe account. Visit the Payment Settings tab to set up Stripe Connect.
          </p>
        </div>
      )}

      <div className="border-b border-accent-text/10">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('created')}
            className={`${
              activeTab === 'created'
                ? 'border-accent-text text-accent-text'
                : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Created Courses
          </button>
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`${
              activeTab === 'enrolled'
                ? 'border-accent-text text-accent-text'
                : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Enrolled Courses
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'created' ? (
          createdCourses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-content/60">
              You haven't created any courses yet
            </div>
          ) : (
            createdCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showStatus={true}
              />
            ))
          )
        ) : (
          enrolledCourses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-content/60">
              You haven't enrolled in any courses yet
            </div>
          ) : (
            enrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showStatus={false}
              />
            ))
          )
        )}
      </div>

      {showCreateModal && (
        <CourseForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
          hasStripeConnect={hasStripeConnect}
        />
      )}
    </div>
  );
}