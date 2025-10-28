import React from 'react';
import { User, Users, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar } from '../Profile/Avatar';

interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url?: string;
  username?: string;
}

interface AboutCommunityDisplayProps {
  aboutText?: string;
  teamMembers?: TeamMember[];
  isAdmin?: boolean;
  onEdit?: () => void;
}

export function AboutCommunityDisplay({ 
  aboutText, 
  teamMembers = [], 
  isAdmin = false, 
  onEdit 
}: AboutCommunityDisplayProps) {
  if (!aboutText && teamMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No About Information</h3>
        <p className="text-gray-500 mb-6">
          {isAdmin 
            ? "Set up your community's about page to share your story and team with members."
            : "This community hasn't set up their about page yet."
          }
        </p>
        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-md hover:bg-accent-text/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Set Up About Page
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* About Text */}
      {aboutText && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">About Us</h3>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {aboutText}
            </p>
          </div>
        </div>
      )}

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Our Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <Avatar
                    url={member.avatar_url}
                    size="lg"
                    userId={member.user_id}
                    editable={false}
                  />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{member.name}</h4>
                {member.username && (
                  <Link 
                    to={`/profile/${member.user_id}`}
                    className="text-sm text-accent-text hover:text-accent-text/80 transition-colors block mb-1"
                  >
                    @{member.username}
                  </Link>
                )}
                <p className="text-sm text-gray-600 mb-3">{member.role}</p>
                {member.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {member.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Edit Button for Admins */}
      {isAdmin && onEdit && (
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-md hover:bg-accent-text/90"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit About Page
          </button>
        </div>
      )}
    </div>
  );
}
