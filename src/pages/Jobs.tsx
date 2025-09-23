import React, { useEffect, useState } from 'react';
import { JobCard } from '../components/Jobs/JobCard';
import { JobFilters } from '../components/Jobs/Filters/JobFilters';
import { JobForm } from '../components/Listings/Forms/JobForm';
import { Hero } from '../components/Hero';
import { supabase } from '../lib/supabase';
import type { Job } from '../types/jobs';

interface Filters {
  jobTypes: string[];
  countries: string[];
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    jobTypes: [],
    countries: []
  });

  useEffect(() => {
    async function fetchJobs() {
      try {
        let query = supabase
          .from('job_offers')
          .select(`
            *,
            user:users (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved');

        if (filters.jobTypes.length > 0) {
          query = query.in('job_type', filters.jobTypes);
        }

        if (filters.countries.length > 0) {
          query = query.in('country', filters.countries);
        }

        const { data, error } = await query;
        if (error) throw error;
        setJobs(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, [filters]);

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  return (
    <div>
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/wellness-cooking-job.png"
          alt="Wellness Career Opportunities"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Wellness Career Opportunities
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Find meaningful career opportunities in the wellness industry. Connect with organisations that share your values and vision.
        </p>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-accent-text text-white rounded-lg font-medium hover:bg-accent-text/90 transition-colors shadow-sm"
        >
          Submit Listing
        </button>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block">
        <Hero
          title="Wellness Career Opportunities"
          subtitle="Find meaningful career opportunities in the wellness industry. Connect with organisations that share your values and vision."
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/wellness-cooking-job.png"
          showAddListing
          onAddListing={() => setShowCreateModal(true)}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
        <JobFilters
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
        ) : jobs.length === 0 ? (
          <div className="bg-background rounded-lg p-8 text-center">
            <p className="text-content">No jobs match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
        </div>
      </div>

      {showCreateModal && (
        <JobForm
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