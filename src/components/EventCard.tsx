import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Avatar } from './Profile/Avatar';
import { formatDate, formatTime } from '../lib/utils/dateUtils';
import type { Event } from '../types/events';

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();

  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/events/${event.id}`}>
        <div className="aspect-w-16 aspect-h-9">
          <img
            src={event.image_url || 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=400'}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
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
              <span className="text-sm text-content group-hover:text-accent-text">
                {event.user.username || 'Anonymous'}
              </span>
            </Link>
          )}
          <span className="px-2 py-1 text-xs font-medium bg-accent-base text-accent-text rounded-full">
            {event.event_type}
          </span>
        </div>

        <Link to={`/events/${event.id}`}>
          <h3 className="text-lg font-semibold text-content mb-2 hover:text-accent-text">
            {event.title}
          </h3>
        </Link>

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
        </div>

        {event.price > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-accent-base text-accent-text rounded-full">
                €{event.price}
              </span>
              {event.ticket_url && (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-1 text-sm font-medium text-accent-text hover:text-accent-text/80"
                >
                  <Ticket className="h-4 w-4 mr-1" />
                  Buy Tickets
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}