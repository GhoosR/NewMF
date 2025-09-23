import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from '../../Practitioners/Filters/FilterDropdown';
import { europeanCountries } from '../../../lib/constants/countries';

interface Filters {
  jobTypes: string[];
  countries: string[];
}

interface JobFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, values: string[]) => void;
}

const jobTypes = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'internship', label: 'Internship' }
];

export function JobFilters({ filters, onFilterChange }: JobFiltersProps) {
  const hasActiveFilters = filters.jobTypes.length > 0 || filters.countries.length > 0;

  const clearAllFilters = () => {
    onFilterChange('jobTypes', []);
    onFilterChange('countries', []);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Job Type"
          options={jobTypes}
          selectedValues={filters.jobTypes}
          onChange={(values) => onFilterChange('jobTypes', values)}
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