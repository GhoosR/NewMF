import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from '../../Practitioners/Filters/FilterDropdown';
import { eventTypes } from '../../../lib/constants/eventTypes';
import { europeanCountries } from '../../../lib/constants/countries';

interface Filters {
  eventTypes: string[];
  countries: string[];
}

interface EventFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, values: string[]) => void;
}

export function EventFilters({ filters, onFilterChange }: EventFiltersProps) {
  const hasActiveFilters = filters.eventTypes.length > 0 || filters.countries.length > 0;

  const clearAllFilters = () => {
    onFilterChange('eventTypes', []);
    onFilterChange('countries', []);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Event Type"
          options={eventTypes}
          selectedValues={filters.eventTypes}
          onChange={(values) => onFilterChange('eventTypes', values)}
        />
        <FilterDropdown
          label="Country"
          options={europeanCountries}
          selectedValues={filters.countries}
          onChange={(values) => onFilterChange('countries', values)}
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