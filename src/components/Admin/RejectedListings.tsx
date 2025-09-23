import React, { useEffect, useState } from 'react';
import { ListingCard } from './ListingCard';
import { fetchListingsByStatus, updateListingStatus } from '../../lib/admin/listingUtils';
import type { AdminListing } from '../../types/admin';

export function RejectedListings() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRejectedListings = async () => {
    try {
      const data = await fetchListingsByStatus('rejected');
      setListings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedListings();
  }, []);

  const handleApprove = async (listing: AdminListing) => {
    try {
      await updateListingStatus(listing, 'approved');
      await fetchRejectedListings();
    } catch (err: any) {
      console.error('Error approving listing:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {listings.length === 0 ? (
        <p className="text-content/60 text-center py-8">No rejected listings</p>
      ) : (
        listings.map((listing) => (
          <ListingCard
            key={`${listing.type}-${listing.id}`}
            listing={listing}
            showRejectButton={false}
            onApprove={() => handleApprove(listing)}
          />
        ))
      )}
    </div>
  );
}