import React, { useEffect, useState } from 'react';
import { CourseCard } from '../components/Courses/CourseCard';
import { CourseFilters } from '../components/Courses/Filters/CourseFilters';
import { CourseForm } from '../components/Courses/CourseForm'; 
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import type { Course } from '../types/courses';

interface Filters {
  categories: string[];
  languages: string[];
  priceRange: string;
}

export function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    languages: [],
    priceRange: ''
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(!!data?.is_admin);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        let query = supabase
          .from('courses')
          .select(`
            *,
            user:users (
              username,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved');

        // Apply category filter
        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories);
        }

        // Apply language filter
        if (filters.languages.length > 0) {
          query = query.in('language', filters.languages);
        }

        // Apply price range filter
        if (filters.priceRange) {
          switch (filters.priceRange) {
            case 'free':
              query = query.eq('price', 0);
              break;
            case 'under_50':
              query = query.gt('price', 0).lte('price', 50);
              break;
            case '50_100':
              query = query.gt('price', 50).lte('price', 100);
              break;
            case 'over_100':
              query = query.gt('price', 100);
              break;
          }
        }

        const { data, error: fetchError } = await query;
        if (fetchError) throw fetchError;
        
        // Get lesson counts for each course
        const coursesWithCounts = await Promise.all(
          (data || []).map(async (course) => {
            const { count } = await supabase
              .from('lessons')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);

            return {
              ...course,
              _count: { lessons: count || 0 }
            };
          })
        );
        
        setCourses(coursesWithCounts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [filters]);

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'priceRange' ? values[0] || '' : values
    }));
  };

  return (
    <div>
      <Meta 
        title="Online Wellness Courses | Mindful Family"
        description="Learn from expert instructors with our online wellness courses. Expand your knowledge in yoga, meditation, nutrition, and holistic health."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Man%20teaching%20a%20woman%20about%20wellness%20courses.webp"
          alt="Explore, Learn, and Grow at Your Own Pace"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Explore, Learn, and Grow at Your Own Pace
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Join a community of passionate instructors and enthusiastic learners. Dive into a world of learning with our vibrant, community-curated wellness courses.
        </p>
        {isAdmin && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
          >
            Submit Listing
          </button>
        )}
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block">
        <Hero
          title="Explore, Learn, and Grow at Your Own Pace."
          subtitle="Join a community of passionate instructors and enthusiastic learners. Dive into a world of learning with our vibrant, community-curated wellness courses. "
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Man%20teaching%20a%20woman%20about%20wellness%20courses.webp"
          showAddListing={isAdmin}
          onAddListing={isAdmin ? () => setShowCreateModal(true) : undefined}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto py-12">
        <CourseFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-background rounded-lg p-8 text-center">
            <p className="text-content">No courses match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
        </div>
      </div>
      
      {showCreateModal && (
        <CourseForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}