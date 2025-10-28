import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Avatar } from '../Profile/Avatar';
import { Username } from '../Profile/Username';
import { formatDate, formatTime } from '../../lib/utils/dateUtils';
import { formatCategoryName } from '../../lib/utils/formatters';
import type { Event } from '../../types/events';

interface EventCardProps {
  event: Event;
  showStatus?: boolean;
}

export function EventCard({ event, showStatus = false }: EventCardProps) {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();
  const isEventOver = endDate < new Date();

  return (
    <div className={`bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${isEventOver ? 'opacity-75' : ''}`}>
      <Link to={`/events/${event.slug}`}>
        <div className="aspect-w-16 aspect-h-9 relative">
          <img
            src={event.image_url || 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=400'}
            alt={event.title}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
          {isEventOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-gray-800 font-semibold text-sm">Event Over</span>
              </div>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          {event.user && (
            <Link 
              to={`/profile/${event.user_id}/listings`}
              className="flex items-center space-x-2 group"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar 
                url={event.user.avatar_url} 
                size="sm" 
                userId={event.user_id}
                editable={false}
              />
              <Username 
                username={event.user.username || 'Anonymous'}
                userId={event.user_id}
                className="text-sm text-content group-hover:text-accent-text"
              />
            </Link>
          )}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
              {formatCategoryName(event.event_type)}
            </span>
            {showStatus && event.approval_status === 'pending' && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Pending
              </span>
            )}
          </div>
        </div>

        <Link to={`/events/${event.slug}`}>
          <h3 className={`text-lg font-semibold mb-2 hover:text-accent-text ${isEventOver ? 'text-content/60' : 'text-content'}`}>
            {event.title}
          </h3>
        </Link>
        
        {isEventOver && (
          <div className="mb-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              Event Concluded
            </span>
          </div>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-content/80">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {isMultiDay 
                ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                : formatDate(startDate)}
            </span>
          </div>
          <div className="flex items-center text-sm text-content/80">
            <Clock className="h-4 w-4 mr-2" />
            <span>{`${formatTime(startDate)} - ${formatTime(endDate)}`}</span>
          </div>
          <div className="flex items-center text-sm text-content/80">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{event.location}</span>
          </div>
          {event.max_participants && (
            <div className="flex items-center text-sm text-content/80">
              <Users className="h-4 w-4 mr-2" />
              <span>
                {event.current_participants || 0} / {event.max_participants} participants
              </span>
            </div>
          )}
        </div>

        {event.price > 0 && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
              €{event.price}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}