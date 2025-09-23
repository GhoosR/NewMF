import React from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from '../../Practitioners/Filters/FilterDropdown';

interface Filters {
  cuisineTypes: string[];
  difficulties: string[];
  dietaryPreferences: string[];
  timeRange: string;
}

interface RecipeFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, values: string[]) => void;
}

const cuisineTypes = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'french', label: 'French' },
  { value: 'american', label: 'American' },
  { value: 'middle_eastern', label: 'Middle Eastern' }
];

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const dietaryPreferences = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'nut_free', label: 'Nut Free' }
];

const timeRanges = [
  { value: 'under_30', label: 'Under 30 mins' },
  { value: '30_60', label: '30-60 mins' },
  { value: 'over_60', label: 'Over 60 mins' }
];

export function RecipeFilters({ filters, onFilterChange }: RecipeFiltersProps) {
  const hasActiveFilters = filters.cuisineTypes.length > 0 || 
                          filters.difficulties.length > 0 || 
                          filters.dietaryPreferences.length > 0 || 
                          filters.timeRange !== '';

  const clearAllFilters = () => {
    onFilterChange('cuisineTypes', []);
    onFilterChange('difficulties', []);
    onFilterChange('dietaryPreferences', []);
    onFilterChange('timeRange', ['']);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <FilterDropdown
          label="Cuisine Type"
          options={cuisineTypes}
          selectedValues={filters.cuisineTypes}
          onChange={(values) => onFilterChange('cuisineTypes', values)}
        />
        <FilterDropdown
          label="Difficulty"
          options={difficulties}
          selectedValues={filters.difficulties}
          onChange={(values) => onFilterChange('difficulties', values)}
        />
        <FilterDropdown
          label="Dietary Preferences"
          options={dietaryPreferences}
          selectedValues={filters.dietaryPreferences}
          onChange={(values) => onFilterChange('dietaryPreferences', values)}
        />
        <FilterDropdown
          label="Time"
          options={timeRanges}
          selectedValues={[filters.timeRange]}
          onChange={(values) => onFilterChange('timeRange', values)}
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