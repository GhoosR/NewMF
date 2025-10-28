import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, Clock, ArrowLeft, Calendar, Edit, Trash2, Ticket, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { BookmarkButton } from '../components/BookmarkButton';
import { EventForm } from '../components/Listings/Forms/EventForm';
import { TicketPurchaseModal } from '../components/Events/TicketPurchaseModal';
import { ImageGalleryModal } from '../components/ui/ImageGalleryModal';
import { Meta } from '../components/Meta';
import { formatDate, formatTime } from '../lib/utils/dateUtils';
import { formatCategoryName } from '../lib/utils/formatters';
import type { Event } from '../types/events';

export function EventDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnEvent, setIsOwnEvent] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchEvent = async () => {
    if (!slug) return;
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('events')
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
      if (!data) throw new Error('Event not found');

      setEvent(data);
      setIsOwnEvent(currentUser?.id === data.user_id);
    } catch (err: any) {
      console.error('Error fetching event:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [slug]);

  const handleDelete = async () => {
    if (!event?.id || !window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (deleteError) throw deleteError;
      navigate('/events');
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/events"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to events
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Event not found'}
          </h2>
          <Link 
            to="/events" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all events
          </Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const isMultiDay = startDate.toDateString() !== endDate.toDateString();
  const hasTickets = event.price > 0 && event.ticket_url;

  return (
    <>
      <Meta 
        title={`${event.title} - Wellness Event`}
        description={`Join us for ${event.title} on ${formatDate(event.start_date)}. ${event.description.substring(0, 150)}...`}
        image={event.image_url}
        type="event"
      />
      <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/events"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to events
        </Link>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-64 sm:h-96">
              <img
                src={event.image_url || 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?auto=format&fit=crop&q=80&w=1920'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {event.user && (
                  <Link 
                    to={`/profile/${event.user.id}/listings`}
                    className="flex items-center space-x-3 group"
                  >
                    <Avatar 
                      url={event.user.avatar_url} 
                      size="md"
                      userId={event.user.id}
                      editable={false}
                    />
                    <div>
                      <Username 
                        username={event.user.username || 'Anonymous'}
                        userId={event.user.id}
                        verified={event.user.verified}
                        className="block text-sm font-medium text-content group-hover:text-accent-text"
                      />
                      <span className="block text-sm text-content/60">
                        Event Organiser
                      </span>
                    </div>
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {isOwnEvent && (
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
                    {formatCategoryName(event.event_type)}
                  </span>
                  {!isOwnEvent && (
                    <BookmarkButton targetId={event.id} targetType="events" />
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-content mb-4">{event.title}</h1>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Calendar className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Date & Time</h3>
              </div>
              <div className="space-y-1">
                <p className="text-content/80">
                  {isMultiDay 
                    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                    : formatDate(startDate)}
                </p>
                <p className="text-content/80">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className="text-content/80">{event.location}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Users className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Capacity</h3>
              </div>
              <p className="text-content/80">
                {event.max_participants 
                  ? `${event.current_participants || 0} / ${event.max_participants} participants`
                  : 'Unlimited capacity'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">About this event</h2>
            <div className="text-content/80 whitespace-pre-line">{event.description}</div>
          </div>

          {/* Ticket Information */}
          {hasTickets && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <Ticket className="h-5 w-5 mr-2 text-accent-text" />
                <h2 className="text-xl font-semibold text-content">Ticket Information</h2>
              </div>
              <div className="bg-accent-base/10 rounded-lg p-4">
                <p className="text-lg font-medium text-accent-text mb-2">€{event.price} per ticket</p>
                <a
                  href={event.ticket_url.startsWith('http') ? event.ticket_url : `https://${event.ticket_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center px-6 py-3 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Buy Tickets
                </a>
              </div>
            </div>
          )}

          {/* Gallery */}
          {event.images && event.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {event.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setShowImageGallery(true);
                    }}
                    className="rounded-lg w-full h-48 overflow-hidden hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={image}
                      alt={`${event.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImageGallery && event.images && (
        <ImageGalleryModal
          images={event.images}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageGallery(false)}
        />
      )}

      {showEditModal && (
        <EventForm
          onClose={() => setShowEditModal(false)}
          editId={event.id}
          onSuccess={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}
      </div>
    </>
  );
}