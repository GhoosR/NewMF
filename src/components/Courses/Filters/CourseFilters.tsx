import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from '../../Practitioners/Filters/FilterDropdown';

interface Filters {
  categories: string[];
  languages: string[];
  priceRange: string;
}

interface CourseFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, values: string[]) => void;
}

const categories = [
  { value: 'wellness', label: 'Wellness & Health' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'personal_growth', label: 'Personal Growth' }
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' }
];

const priceRanges = [
  { value: 'free', label: 'Free' },
  { value: 'under_50', label: 'Under €50' },
  { value: '50_100', label: '€50 - €100' },
  { value: 'over_100', label: 'Over €100' }
];

export function CourseFilters({ filters, onFilterChange }: CourseFiltersProps) {
  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.languages.length > 0 || 
                          filters.priceRange !== '';

  const clearAllFilters = () => {
    onFilterChange('categories', []);
    onFilterChange('languages', []);
    onFilterChange('priceRange', ['']);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Category"
          options={categories}
          selectedValues={filters.categories}
          onChange={(values) => onFilterChange('categories', values)}
          multiSelect={true}
        />
        <FilterDropdown
          label="Language"
          options={languages}
          selectedValues={filters.languages}
          onChange={(values) => onFilterChange('languages', values)}
          multiSelect={true}
        />
        <FilterDropdown
          label="Price Range"
          options={priceRanges}
          selectedValues={filters.priceRange ? [filters.priceRange] : []}
          onChange={(values) => onFilterChange('priceRange', values)}
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