import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Users, Clock, ArrowLeft, Edit, Trash2, Bed, Bath, Utensils, Home, Mail, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/Profile/Avatar';
import { Username } from '../components/Profile/Username';
import { BookmarkButton } from '../components/BookmarkButton';
import { VenueForm } from '../components/Listings/Forms/VenueForm';
import { ImageGalleryModal } from '../components/ui/ImageGalleryModal';
import { Meta } from '../components/Meta';
import { formatCategoryName } from '../lib/utils/formatters';
import type { Venue } from '../types/venues';

export function VenueDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnVenue, setIsOwnVenue] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Venue | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    async function fetchVenue() {
      if (!slug) return;
      
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setIsAuthenticated(!!currentUser);
        
        const { data, error } = await supabase
          .from('venues')
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
        if (!data) throw new Error('Venue not found');

        setVenue(data);
        setIsOwnVenue(currentUser?.id === data.user_id);
      } catch (err: any) {
        console.error('Error fetching venue:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [slug]);

  const handleDelete = async () => {
    if (!venue?.id || !window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venue.id);

      if (deleteError) throw deleteError;
      navigate('/venues');
    } catch (err: any) {
      console.error('Error deleting venue:', err);
      alert('Failed to delete venue. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/venues"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to venues
        </Link>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-content mb-4">
            {error || 'Venue not found'}
          </h2>
          <Link 
            to="/venues" 
            className="text-accent-text hover:text-accent-text/80"
          >
            View all venues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Meta 
        title={`${venue.name} - Wellness Venue`}
        description={`Discover ${venue.name}, a ${venue.category} venue. ${venue.description.substring(0, 150)}...`}
        image={venue.image_url}
        type="place"
      />
      <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        <Link 
          to="/venues"
          className="inline-flex items-center text-accent-text hover:text-accent-text/80 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to venues
        </Link>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-64 sm:h-96">
              <img
                src={venue.images?.[0] || 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&q=80&w=1920'}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                {venue.user && (
                  <Link 
                    to={`/profile/${venue.user.id}/listings`}
                    className="flex items-center space-x-3 group"
                  >
                    <Avatar 
                      url={venue.user.avatar_url} 
                      size="md"
                      userId={venue.user.id}
                      editable={false}
                    />
                    <div>
                      <Username 
                        username={venue.user.username || 'Anonymous'}
                        userId={venue.user.id}
                        verified={venue.user.verified}
                        className="block text-sm font-medium text-content group-hover:text-accent-text"
                      />
                      <span className="block text-sm text-content/60">
                        Venue Owner
                      </span>
                    </div>
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  {!isOwnVenue && venue.user && (
                    <>
                      {isAuthenticated ? (
                        <Link
                          to={`/chat/${venue.user.id}`}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Link>
                      ) : (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Sign in to Message
                        </button>
                      )}
                    </>
                  )}
                  {isOwnVenue && (
                    <>
                      <button
                        onClick={() => setShowEditModal(venue)}
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
                    {formatCategoryName(venue.venue_type)}
                  </span>
                  {!isOwnVenue && (
                    <BookmarkButton targetId={venue.id} targetType="venues" />
                  )}
                </div>
              </div>

              <h1 className="text-3xl font-bold text-content mb-4">{venue.name}</h1>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className="text-content/80">{venue.address}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Users className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Capacity</h3>
              </div>
              <p className="text-content/80">Up to {venue.capacity} people</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center text-content/80 mb-2">
                <Clock className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium">Price</h3>
              </div>
              <p className="text-content/80">
                {venue.price 
                 ? `${getCurrencySymbol(venue.currency)}${venue.price}/${venue.price_period || 'hour'}`
                  : 'Contact for pricing'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">About this venue</h2>
            <div className="text-content/80 whitespace-pre-line">{venue.description}</div>
          </div>

          {/* Accommodation Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-3">
                <Home className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium text-content">Sleeping Places</h3>
              </div>
              <p className="text-2xl font-semibold text-content">{venue.sleeping_places}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-3">
                <Bed className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium text-content">Bedrooms</h3>
              </div>
              <p className="text-2xl font-semibold text-content">{venue.bedrooms}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-3">
                <Bath className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium text-content">Bathrooms</h3>
              </div>
              <p className="text-2xl font-semibold text-content">{venue.bathrooms}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-3">
                <Utensils className="h-5 w-5 mr-2 text-accent-text" />
                <h3 className="font-medium text-content">Kitchens</h3>
              </div>
              <p className="text-2xl font-semibold text-content">{venue.kitchens}</p>
            </div>
          </div>

          {/* Amenities */}
          {venue.amenities && venue.amenities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {venue.amenities.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm bg-accent-base/10 text-accent-text rounded-full"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-content mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center text-content/80">
                <Mail className="h-5 w-5 mr-3 text-accent-text" />
                <span>{venue.contact_email}</span>
              </div>
              {venue.contact_phone && (
                <div className="flex items-center text-content/80">
                  <Phone className="h-5 w-5 mr-3 text-accent-text" />
                  <span>{venue.contact_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gallery */}
          {venue.images && venue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {venue.images.map((image, index) => (
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
                      alt={`${venue.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showImageGallery && venue.images && (
        <ImageGalleryModal
          images={venue.images}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageGallery(false)}
        />
      )}

      {showEditModal && (
        <VenueForm
          editVenue={showEditModal}
          onSuccess={() => {
            setShowEditModal(null);
            window.location.reload();
          }}
        />
      )}
      </div>
    </>
  );
}

// Helper function to convert currency code to symbol
function getCurrencySymbol(currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CHF': 'CHF'
  };
  
  return symbols[currency] || currency;
}