import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Building2, Briefcase, Mail } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatCategoryName } from '../../lib/utils/formatters';
import type { Job } from '../../types/jobs';

interface JobCardProps {
  job: Job;
  showStatus?: boolean;
}

export function JobCard({ job, showStatus = false }: JobCardProps) {
  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            {job.user && (
              <Link 
                to={`/profile/${job.user_id}/listings`}
                className="flex items-center space-x-2 group"
              >
                <Avatar 
                  url={job.user.avatar_url} 
                  size="sm" 
                  userId={job.user_id}
                  editable={false}
                />
                <Username 
                  username={job.user.username || 'Anonymous'}
                  userId={job.user_id}
                  className="text-sm text-content group-hover:text-accent-text"
                />
              </Link>
            )}
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
                {formatCategoryName(job.job_type)}
              </span>
              {showStatus && job.approval_status === 'pending' && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pending
                </span>
              )}
            </div>
          </div>

          <Link to={`/jobs/${job.slug}`}>
            <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
              {job.title}
            </h3>
          </Link>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-content/80">
              <Building2 className="h-4 w-4 mr-2" />
              <span>{job.company_name}</span>
            </div>
            <div className="flex items-center text-sm text-content/80">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center text-sm text-content/80">
              <Briefcase className="h-4 w-4 mr-2" />
              <span>{job.salary_range}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.requirements.slice(0, 3).map((req, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-accent-base text-accent-text rounded-full"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="px-2 py-1 text-xs bg-accent-base text-accent-text rounded-full">
                +{job.requirements.length - 3} more
              </span>
            )}
          </div>
        </div>
    </div>
  );
}