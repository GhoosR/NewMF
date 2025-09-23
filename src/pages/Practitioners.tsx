import React, { useEffect, useState } from 'react';
import { PractitionerCard } from '../components/Listings/PractitionerCard';
import { HorizontalFilters } from '../components/Practitioners/Filters/HorizontalFilters';
import { PractitionerForm } from '../components/Listings/Forms/PractitionerForm';
import { Hero } from '../components/Hero';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';
import type { Practitioner } from '../types/practitioners';

interface Filters {
  categories: string[];
  countries: string[];
  languages: string[];
  workArrangements: string[];
}

export function Practitioners() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    countries: [],
    languages: [],
    workArrangements: [],
  });

  useEffect(() => {
    async function fetchPractitioners() {
      try {
        let query = supabase
          .from('practitioners')
          .select(`
            *,
            user:users (
              id,
              username,
              full_name,
              avatar_url,
              verified
            )
          `)
          .eq('approval_status', 'approved');

        if (filters.categories.length > 0) {
          query = query.in('category', filters.categories);
        }
        if (filters.countries.length > 0) {
          query = query.in('country', filters.countries);
        }
        if (filters.languages.length > 0) {
          // Convert comma-separated language string to array and check overlap
          query = query.filter('language', 'ilike', `%${filters.languages[0]}%`);
          // Add additional language filters if more than one selected
          filters.languages.slice(1).forEach(lang => {
            query = query.or(`language.ilike.%${lang}%`);
          });
        }
        if (filters.workArrangements.length > 0) {
          // Enhanced logic: if someone selects "In_Person" or "Online", also show "Hybrid" practitioners
          const workArrangementFilters = [...filters.workArrangements];
          
          // If "In_Person" is selected, also include "Hybrid"
          if (filters.workArrangements.includes('In_Person') && !filters.workArrangements.includes('Hybrid')) {
            workArrangementFilters.push('Hybrid');
          }
          
          // If "Online" is selected, also include "Hybrid"
          if (filters.workArrangements.includes('Online') && !filters.workArrangements.includes('Hybrid')) {
            workArrangementFilters.push('Hybrid');
          }
          
          query = query.in('work_arrangement', workArrangementFilters);
        }

        const { data, error } = await query;
        if (error) throw error;
        setPractitioners(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPractitioners();
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
        title="Find Verified Wellness Practitioners | Mindful Family"
        description="Connect with experienced wellness practitioners, from yoga teachers to nutritionists. Book sessions and start your wellness journey today."
      />
      
      {/* Mobile Full-Width Header */}
      <div className="lg:hidden relative h-64 overflow-hidden">
        <img
          src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/yoga-practitioner.webp"
          alt="Find Wellness Practitioners"
          className="w-full h-full object-cover shadow-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50"></div>
      </div>

      {/* Mobile Content Below Image */}
      <div className="lg:hidden px-4 py-8 text-center bg-gray-50">
        <h1 className="text-3xl font-gelica font-bold text-content mb-4">
          Find Wellness Practitioners
        </h1>
        <p className="text-lg text-content/70 mb-6 max-w-md mx-auto">
          Connect with experienced wellness practitioners who can guide you on your journey to holistic health and well-being.
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
          title="Find Wellness Practitioners"
          subtitle="Connect with experienced wellness practitioners who can guide you on your journey to holistic health and well-being."
          image="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/yoga-practitioner.webp"
          showAddListing
          onAddListing={() => setShowCreateModal(true)}
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        <div className="max-w-7xl mx-auto">
          <HorizontalFilters
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
          ) : practitioners.length === 0 ? (
            <div className="bg-background rounded-lg p-8 text-center">
              <p className="text-content">No practitioners match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practitioners.map((practitioner) => (
                <PractitionerCard key={practitioner.id} practitioner={practitioner} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <PractitionerForm
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