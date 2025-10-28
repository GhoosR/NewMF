import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VenueCard } from '../components/Venues/VenueCard';
import { VenueFilters } from '../components/Venues/Filters/VenueFilters';
import { VenueForm } from '../components/Listings/Forms/VenueForm';
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import { europeanCountries } from '../lib/constants/countries';
import type { Venue } from '../types/venues';

interface Filters {
  venueTypes: string[];
  amenities: string[];
  capacity: string;
  countries: string[];
}

export function Venues() {
  const [searchParams] = useSearchParams();
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
  const userHasInteracted = useRef(false);

  // Initialize filters from URL parameters
  useEffect(() => {
    const countryParam = searchParams.get('country');
    
    if (countryParam) {
      setFilters(prev => ({
        ...prev,
        countries: [countryParam]
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchVenues() {
      try {
        // Only use URL parameter if user hasn't interacted with filters yet
        const countryParam = searchParams.get('country');
        const effectiveFilters = (countryParam && !userHasInteracted.current)
          ? { ...filters, countries: [countryParam] }
          : filters;
          
        let query = supabase
          .from('venues')
          .select(`
            *,
            user:users (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved')
          .not('slug', 'is', null); // Ensure we only get venues with valid slugs

        if (effectiveFilters.venueTypes.length > 0) {
          query = query.in('venue_type', effectiveFilters.venueTypes);
        }

        if (effectiveFilters.countries.length > 0) {
          const expandedCountries = Array.from(new Set(
            effectiveFilters.countries.flatMap((c) => {
              const match = europeanCountries.find(ec => ec.value === c || ec.label === c);
              return match ? [match.value, match.label] : [c];
            })
          ));
          query = query.in('country', expandedCountries);
        }

        if (effectiveFilters.amenities.length > 0) {
          query = query.contains('amenities', effectiveFilters.amenities);
        }

        if (effectiveFilters.capacity) {
          switch (effectiveFilters.capacity) {
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
  }, [filters, searchParams]);

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    // Mark that user has interacted with filters
    userHasInteracted.current = true;
    
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
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/wellness-nature-venue.png"
          alt="Explore Wellness Venues"
          className="w-full h-full object-cover object-bottom shadow-none"
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
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/wellness-nature-venue.png"
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