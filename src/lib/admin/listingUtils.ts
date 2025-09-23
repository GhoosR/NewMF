import { supabase } from '../supabase';
import type { AdminListing } from '../../types/admin';
import { createNotification } from '../notifications';

export async function fetchListingsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<AdminListing[]> {
  const [
    { data: practitioners, error: practitionersError },
    { data: events, error: eventsError },
    { data: venues, error: venuesError },
    { data: jobs, error: jobsError },
    { data: courses, error: coursesError },
    { data: recipes, error: recipesError }
  ] = await Promise.all([
    supabase
      .from('practitioners')
      .select('*, user:users(id, username, avatar_url, full_name, verified)')
      .eq('approval_status', status),
    supabase
      .from('events')
      .select('*, user:users(id, username, avatar_url, verified)')
      .eq('approval_status', status),
    supabase
      .from('venues')
      .select('*, user:users(id, username, avatar_url, verified)')
      .eq('approval_status', status),
    supabase
      .from('job_offers')
      .select('*, user:users(id, username, avatar_url, verified)')
      .eq('approval_status', status),
    supabase
      .from('courses')
      .select('*, user:users(id, username, avatar_url, verified)')
      .eq('approval_status', status),
    supabase
      .from('recipes')
      .select('*, user:users(id, username, avatar_url, verified)')
      .eq('approval_status', status)
  ]);

  if (practitionersError) throw practitionersError;
  if (eventsError) throw eventsError;
  if (venuesError) throw venuesError;
  if (jobsError) throw jobsError;
  if (coursesError) throw coursesError;
  if (recipesError) throw recipesError;

  const allListings: AdminListing[] = [
    ...(practitioners?.map(p => ({ ...p, type: 'practitioner' as const })) || []),
    ...(events?.map(e => ({ ...e, type: 'event' as const })) || []),
    ...(venues?.map(v => ({ ...v, type: 'venue' as const })) || []),
    ...(jobs?.map(j => ({ ...j, type: 'job' as const })) || []),
    ...(courses?.map(c => ({ ...c, type: 'course' as const })) || []),
    ...(recipes?.map(r => ({ ...r, type: 'recipe' as const })) || [])
  ];

  return allListings.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function updateListingStatus(
  listing: AdminListing,
  status: 'pending' | 'approved' | 'rejected'
): Promise<void> {
  try {
    // Start a transaction by using multiple operations
    const tableName = (() => {
      switch (listing.type) {
        case 'practitioner': return 'practitioners';
        case 'event': return 'events';
        case 'venue': return 'venues';
        case 'job': return 'job_offers';
        case 'course': return 'courses';
        case 'recipe': return 'recipes';
      }
    })();

    // First update the listing status
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ approval_status: status })
      .eq('id', listing.id);

    if (updateError) throw updateError;

    // Create notification for approved listings
    if (status === 'approved') {
      await createNotification({
        userId: listing.user_id,
        type: `${listing.type}_approved`,
        title: 'Listing Approved',
        message: `Your ${listing.type} listing "${listing.title || listing.name}" has been approved and is now live.`,
        data: {
          listing_id: listing.id,
          listing_type: listing.type,
          listing_title: listing.title || listing.name,
          listing_slug: listing.slug
        }
      });
    }

    // If approving a practitioner listing with certification, verify the user
    if (status === 'approved' && listing.type === 'practitioner' && listing.certification_url) {
      // Get the current user data first to check if they're already verified
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('verified')
        .eq('id', listing.user_id)
        .single();

      if (userError) throw userError;

      // Only update if not already verified
      if (!userData?.verified) {
        const { error: verifyError } = await supabase
          .from('users')
          .update({ verified: true })
          .eq('id', listing.user_id);

        if (verifyError) throw verifyError;
      }
    }
  } catch (error) {
    console.error('Error updating listing status:', error);
    throw error;
  }
}