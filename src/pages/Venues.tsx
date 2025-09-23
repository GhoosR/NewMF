import React, { useEffect, useState } from 'react';
import { VenueCard } from '../components/Venues/VenueCard';
import { VenueFilters } from '../components/Venues/Filters/VenueFilters';
import { VenueForm } from '../components/Listings/Forms/VenueForm';
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import type { Venue } from '../types/venues';

interface Filters {
  venueTypes: string[];
  amenities: string[];
  capacity: string;
  countries: string[];
}

export function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    venueTypes: [],
    amenities: [],
    capacity: '',
    countries: []
  });

  useEffect(() => {
    async function fetchVenues() {
      try {
        let query = supabase
          .from('venues')
          .select(`
            id,
            name,
            description,
            country,
            address,
            amenities,
            capacity,
            price,
            currency,
            images,
            venue_type,
            contact_email,
            contact_phone,
            sleeping_places,
            bedrooms,
            bathrooms,
            kitchens,
            approval_status,
            created_at,
            updated_at,
            slug,
            user:users (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved')
          .not('slug', 'is', null); // Ensure we only get venues with valid slugs

        if (filters.venueTypes.length > 0) {
          query = query.in('venue_type', filters.venueTypes);
        }

        if (filters.countries.length > 0) {
          query = query.in('country', filters.countries);
        }

        if (filters.amenities.length > 0) {
          query = query.contains('amenities', filters.amenities);
        }

        if (filters.capacity) {
          switch (filters.capacity) {
            case 'under_20':
              query = query.lte('capacity', 19);
              break;
            case '20_50':
              query = query.gte('capacity', 20).lte('capacity', 50);
              break;
            case '50_100':
              query = query.gte('capacity', 50).lte('capacity', 100);
              break;
            case 'over_100':
              query = query.gte('capacity', 100);
              break;
          }
        }

        const { data, error } = await query;
        if (error) throw error;
        setVenues(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVenues();
  }, [filters]);

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: filterType === 'capacity'
        ? values[0] || ''
        : values
    }));
  };

  return (
    <div>
      <Meta 
        title="Book Wellness Venues & Spaces | Mindful Family"
        description="Find and book beautiful venues for wellness activities, from yoga studios to retreat centres. Perfect spaces for your next wellness event."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Wellness%20venue%20finder.png"
          alt="Explore Wellness Venues"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Explore Wellness Venues
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Discover serene and inspiring spaces perfect for wellness activities, retreats, and transformative experiences.
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
          title="Explore Wellness Venues"
          subtitle="Discover serene and inspiring spaces perfect for wellness activities, retreats, and transformative experiences."
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Wellness%20venue%20finder.png"
          showAddListing
          onAddListing={() => setShowCreateModal(true)}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
        <VenueFilters
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
        ) : venues.length === 0 ? (
          <div className="bg-background rounded-lg p-8 text-center">
            <p className="text-content">No venues match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>
        )}
        </div>
      </div>

      {showCreateModal && (
        <VenueForm
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