import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Building2, Briefcase, Mail, ArrowLeft, Edit, Trash2, Globe, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { BookmarkButton } from '../components/BookmarkButton';
import { JobForm } from '../components/Listings/Forms/JobForm';
import { formatCategoryName } from '../lib/utils/formatters';
import type { Job } from '../types/jobs';

export function JobDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnJob, setIsOwnJob] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      if (!slug) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
          .from('job_offers')
          .select(`
            *,
            user:users (
              id,
              username,
              avatar_url,
              verified
            )
          `)
          .eq('slug', slug)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Job not found');

        setJob(data);
        setIsOwnJob(currentUser?.id === data.user_id);
      } catch (err: any) {
        console.error('Error fetching job:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [slug]);

  const handleDelete = async () => {
    if (!job?.id || !window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('job_offers')
        .delete()
        .eq('id', job.id);

      if (deleteError) throw deleteError;
      navigate('/jobs');
    } catch (err: any) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job listing. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/jobs"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to jobs
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Job not found'}
          </h2>
          <Link 
            to="/jobs" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/jobs"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to jobs
        </Link>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {job.user && (
                <Link 
                  to={`/profile/${job.user.id}/listings`}
                  className="flex items-center space-x-3 group"
                >
                  <Avatar 
                    url={job.user.avatar_url} 
                    size="md"
                    userId={job.user.id}
                    editable={false}
                  />
                  <div>
                    <Username 
                      username={job.user.username || 'Anonymous'}
                      userId={job.user.id}
                      verified={job.user.verified}
                      className="block text-sm font-medium text-content group-hover:text-accent-text"
                    />
                    <span className="block text-sm text-content/60">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              )}
              <div className="flex flex-wrap items-center gap-3">
                {!isOwnJob && job.user && (
                  <>
                  </>
                )}
                {isOwnJob && (
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
                )}
                <span className="px-3 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                  {formatCategoryName(job.job_type)}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-content mb-2">{job.title}</h1>
            <h2 className="text-xl text-content/80 mb-6">{job.company_name}</h2>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className="text-content/80">{job.location}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Clock className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Job Type</h3>
              </div>
              <p className="text-content/80">{job.job_type}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Globe className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Salary Range</h3>
              </div>
              <p className="text-content/80">{job.salary_range}</p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">Job Description</h2>
            <div className="text-content/80 whitespace-pre-line">{job.description}</div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">Requirements</h2>
            <div className="space-y-2">
              {job.requirements.map((req, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-accent-text mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-content/80">{req}</span>
                  {!isOwnJob && (
                    <BookmarkButton targetId={job.id} targetType="jobs" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">How to Apply</h2>
            <div className="bg-accent-base/10 rounded-lg p-4">
              <div className="flex items-center text-content/80">
                <Mail className="h-5 w-5 mr-3 text-accent-text" />
                <a 
                  href={`mailto:${job.contact_email}`}
                  className="text-accent-text hover:underline"
                >
                  {job.contact_email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <JobForm
          onClose={() => setShowEditModal(false)}
          editId={job.id}
          onSuccess={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}