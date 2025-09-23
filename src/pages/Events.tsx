import React, { useEffect, useState } from 'react';
import { EventCard } from '../components/Events/EventCard';
import { EventFilters } from '../components/Events/Filters/EventFilters';
import { EventForm } from '../components/Listings/Forms/EventForm';
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import type { Event } from '../types/events';

interface Filters {
  eventTypes: string[];
  countries: string[];
}

export function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    eventTypes: [],
    countries: []
  });

  useEffect(() => {
    async function fetchEvents() {
      try {
        let query = supabase
          .from('events')
          .select(`
            *,
            user:users (
              id,
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('approval_status', 'approved');

        if (filters.eventTypes.length > 0) {
          query = query.in('event_type', filters.eventTypes);
        }

        if (filters.countries.length > 0) {
          query = query.in('country', filters.countries);
        }

        const { data, error } = await query;
        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [filters]);

  const handleFilterChange = (filterType: keyof Filters, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  };

  return (
    <div>
      <Meta 
        title="Wellness Events & Retreats | Mindful Family"
        description="Discover transformative wellness events, workshops, and retreats. Join our community events to enhance your wellbeing and connect with like-minded people."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/tree.webp"
          alt="Discover Wellness Events"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Discover Wellness Events
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Find and join transformative wellness events, workshops, and retreats that nourish your mind, body, and soul.
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
          title="Discover Wellness Events"
          subtitle="Find and join transformative wellness events, workshops, and retreats that nourish your mind, body, and soul."
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/tree.webp"
          showAddListing
          onAddListing={() => setShowCreateModal(true)}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <EventFilters
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
          ) : events.length === 0 ? (
            <div className="bg-background rounded-lg p-8 text-center">
              <p className="text-content">No events match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <EventForm
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