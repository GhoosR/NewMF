import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { categories } from '../../../lib/constants/categories';
import { europeanCountries } from '../../../lib/constants/countries';
import { languages } from '../../../lib/constants/languages';
import { workArrangements } from '../../../lib/constants';

interface Filters {
  categories: string[];
  countries: string[];
  languages: string[];
  workArrangements: string[];
}

interface HorizontalFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string[]) => void;
}

export function HorizontalFilters({ filters, onFilterChange }: HorizontalFiltersProps) {
  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.countries.length > 0 || 
                          filters.languages.length > 0 || 
                          filters.workArrangements.length > 0;

  const clearAllFilters = () => {
    onFilterChange('categories', []);
    onFilterChange('countries', []);
    onFilterChange('languages', []);
    onFilterChange('workArrangements', []);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Categories"
          options={categories}
          selectedValues={filters.categories}
          onChange={(values) => onFilterChange('categories', values)}
        />
        <FilterDropdown
          label="Countries"
          options={europeanCountries}
          selectedValues={filters.countries}
          onChange={(values) => onFilterChange('countries', values)}
        />
        <FilterDropdown
          label="Languages"
          options={languages}
          selectedValues={filters.languages}
          onChange={(values) => onFilterChange('languages', values)}
        />
        <FilterDropdown
          label="Work Type"
          options={workArrangements}
          selectedValues={filters.workArrangements}
          onChange={(values) => onFilterChange('workArrangements', values)}
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