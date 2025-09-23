import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from '../../Practitioners/Filters/FilterDropdown';
import { venueTypes } from '../../../lib/constants/venueTypes';
import { amenities } from '../../../lib/constants/amenities';
import { europeanCountries } from '../../../lib/constants/countries';

interface Filters {
  venueTypes: string[];
  amenities: string[];
  capacity: string;
  countries: string[];
}

interface VenueFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, values: string[]) => void;
}

const capacityRanges = [
  { value: 'under_20', label: 'Under 20 people' },
  { value: '20_50', label: '20-50 people' },
  { value: '50_100', label: '50-100 people' },
  { value: 'over_100', label: 'Over 100 people' }
];

export function VenueFilters({ filters, onFilterChange }: VenueFiltersProps) {
  const hasActiveFilters = filters.venueTypes.length > 0 || 
                          filters.amenities.length > 0 || 
                          filters.capacity !== '' || 
                          filters.countries.length > 0;

  const clearAllFilters = () => {
    onFilterChange('venueTypes', []);
    onFilterChange('amenities', []);
    onFilterChange('capacity', ['']);
    onFilterChange('countries', []);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Venue Type"
          options={venueTypes}
          selectedValues={filters.venueTypes}
          onChange={(values) => onFilterChange('venueTypes', values)}
        />
        <FilterDropdown
          label="Country"
          options={europeanCountries}
          selectedValues={filters.countries}
          onChange={(values) => onFilterChange('countries', values)}
        />
        <FilterDropdown
          label="Amenities"
          options={amenities}
          selectedValues={filters.amenities}
          onChange={(values) => onFilterChange('amenities', values)}
        />
        <FilterDropdown
          label="Capacity"
          options={capacityRanges}
          selectedValues={[filters.capacity]}
          onChange={(values) => onFilterChange('capacity', values)}
          multiSelect={false}
        />
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}