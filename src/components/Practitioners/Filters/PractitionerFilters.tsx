import React from 'react';
import { FilterSection } from './FilterSection';
import { FilterCheckbox } from './FilterCheckbox';
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

interface PractitionerFiltersProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
}

export function PractitionerFilters({ filters, onFilterChange }: PractitionerFiltersProps) {
  const toggleFilter = (type: keyof Filters, value: string) => {
    onFilterChange(type, value);
  };

  return (
    <div className="bg-background p-4 rounded-lg border border-accent-text/10">
      <h2 className="text-lg font-semibold text-content mb-4">Filters</h2>
      
      <FilterSection title="Categories">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {categories.map((category) => (
            <FilterCheckbox
              key={category.value}
              label={category.label}
              value={category.value}
              checked={filters.categories.includes(category.value)}
              onChange={(value) => toggleFilter('categories', value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Countries">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {europeanCountries.map((country) => (
            <FilterCheckbox
              key={country.value}
              label={country.label}
              value={country.value}
              checked={filters.countries.includes(country.value)}
              onChange={(value) => toggleFilter('countries', value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Languages">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {languages.map((language) => (
            <FilterCheckbox
              key={language.value}
              label={language.label}
              value={language.value}
              checked={filters.languages.includes(language.value)}
              onChange={(value) => toggleFilter('languages', value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Work Arrangement">
        <div className="space-y-2">
          {workArrangements.map((arrangement) => (
            <FilterCheckbox
              key={arrangement.value}
              label={arrangement.label}
              value={arrangement.value}
              checked={filters.workArrangements.includes(arrangement.value)}
              onChange={(value) => toggleFilter('workArrangements', value)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}