import React from 'react';
import { Calendar, MapPin, DollarSign, Globe, Lock, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils/dateUtils';
import type { Event } from '../../types/events';

interface CommunityEventCardProps {
  event: Event & {
    pinned?: boolean;
    pinned_at?: string;
  };
  isAdmin?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  onDelete?: () => void;
}

export function CommunityEventCard({ 
  event, 
  isAdmin = false, 
  onPin, 
  onUnpin, 
  onDelete 
}: CommunityEventCardProps) {
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  return (
    <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${
      event.pinned ? 'ring-2 ring-accent-text' : ''
    }`}>
      {event.pinned && (
        <div className="bg-accent-text text-white px-3 py-1 text-xs font-medium flex items-center">
          <Pin className="h-3 w-3 mr-1" />
          Pinned Event
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link 
                to={`/events/${event.id}`}
                className="hover:text-accent-text transition-colors"
              >
                {event.title}
              </Link>
            </h3>
            
            <div className="flex items-center text-sm text-gray-500 mb-2">
              {event.visibility === 'public' ? (
                <Globe className="h-4 w-4 mr-1 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 mr-1 text-gray-600" />
              )}
              <span className="capitalize">{event.visibility} event</span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              {event.pinned ? (
                <button
                  onClick={onUnpin}
                  className="p-2 text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
                  title="Unpin event"
                >
                  <Pin className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={onPin}
                  className="p-2 text-gray-400 hover:text-accent-text hover:bg-accent-base/10 rounded-full transition-colors"
                  title="Pin event"
                >
                  <Pin className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {!isSameDay && (
                <span>
                  {' '}to {endDate.toLocaleDateString()} at {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{event.location}, {event.country}</span>
          </div>

          {event.price > 0 && (
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
              <span>${event.price.toFixed(2)}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 line-clamp-2">
              {event.description}
            </p>
          </div>
        )}

        {event.image_url && (
          <div className="mt-4">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <span>Event Type: {event.event_type}</span>
          </div>
          
          {event.ticket_url && (
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-text hover:text-accent-text/80 font-medium"
            >
              Get Tickets →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}


