import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AddListingButton } from '../../components/Listings/AddListingButton';
import { PractitionerCard } from '../../components/Listings/PractitionerCard';
import { EventCard } from '../../components/Events/EventCard';
import { VenueCard } from '../../components/Venues/VenueCard';
import { JobCard } from '../../components/Jobs/JobCard';
import { ListingTypeTabs } from '../../components/Profile/ListingTypeTabs';
import { supabase } from '../../lib/supabase';
import type { Practitioner } from '../../types/practitioners';
import type { Event } from '../../types/events';
import type { Venue } from '../../types/venues';
import type { Job } from '../../types/jobs';

interface ListingsTabProps {
  userId: string;
}

export function ListingsTab({ userId }: ListingsTabProps) {
  const [activeType, setActiveType] = useState('all');
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwnProfile(user?.id === userId);
    };
    checkOwnership();
  }, [userId]);

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        setError(null);

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const isOwner = currentUser?.id === userId;

        // Fetch practitioners
        if (activeType === 'all' || activeType === 'practitioners') {
          let query = supabase
            .from('practitioners')
            .select(`
              *,
              user:users (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('user_id', userId);

          // Only show approved listings to non-owners
          if (!isOwner) {
            query = query.eq('approval_status', 'approved');
          }

          const { data: practitionersData, error: practitionersError } = await query;
          if (practitionersError) throw practitionersError;
          setPractitioners(practitionersData || []);
        }

        // Fetch events
        if (activeType === 'all' || activeType === 'events') {
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
            .eq('user_id', userId);

          // Only show approved listings to non-owners
          if (!isOwner) {
            query = query.eq('approval_status', 'approved');
          }

          const { data: eventsData, error: eventsError } = await query;
          if (eventsError) throw eventsError;
          setEvents(eventsData || []);
        }

        // Fetch venues
        if (activeType === 'all' || activeType === 'venues') {
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
            .eq('user_id', userId);

          // Only show approved listings to non-owners
          if (!isOwner) {
            query = query.eq('approval_status', 'approved');
          }

          const { data: venuesData, error: venuesError } = await query;
          if (venuesError) throw venuesError;
          setVenues(venuesData || []);
        }

        // Fetch jobs
        if (activeType === 'all' || activeType === 'jobs') {
          let query = supabase
            .from('job_offers')
            .select(`
              *,
              user:users (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('user_id', userId);

          // Only show approved listings to non-owners
          if (!isOwner) {
            query = query.eq('approval_status', 'approved');
          }

          const { data: jobsData, error: jobsError } = await query;
          if (jobsError) throw jobsError;
          setJobs(jobsData || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [userId, activeType]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  const hasListings = practitioners.length > 0 || events.length > 0 || venues.length > 0 || jobs.length > 0;

  return (
    <div className="bg-background rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-content">
            {isOwnProfile ? 'Your Listings' : 'Listings'}
          </h2>
          {isOwnProfile && <AddListingButton />}
        </div>
        
        <ListingTypeTabs activeType={activeType} onTypeChange={setActiveType} />
        
        {error && (
          <div className="text-red-600 mb-4">{error}</div>
        )}

        {!hasListings ? (
          <p className="text-content/60">No listings yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeType === 'all' || activeType === 'practitioners') &&
              practitioners.map((practitioner) => (
                <Link key={practitioner.id} to={`/practitioners/${practitioner.slug}`}>
                  <PractitionerCard practitioner={practitioner} />
                </Link>
              ))}
            
            {(activeType === 'all' || activeType === 'events') &&
              events.map((event) => (
                <Link key={event.id} to={`/events/${event.slug}`}>
                  <EventCard event={event} />
                </Link>
              ))}

            {(activeType === 'all' || activeType === 'venues') &&
              venues.map((venue) => (
                <Link key={venue.id} to={`/venues/${venue.slug}`}>
                  <VenueCard venue={venue} />
                </Link>
              ))}

            {(activeType === 'all' || activeType === 'jobs') &&
              jobs.map((job) => (
                <Link key={job.id} to={`/jobs/${job.slug}`}>
                  <JobCard job={job} />
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}