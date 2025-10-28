import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Calendar, Building2, Briefcase, MapPin } from 'lucide-react';
import { europeanCountries } from '../lib/constants/countries';

interface SearchBoxProps {
  className?: string;
}

export function SearchBox({ className = '' }: SearchBoxProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');

  const categories = [
    { value: 'practitioners', label: 'Practitioner', icon: Users },
    { value: 'events', label: 'Event & Retreat', icon: Calendar },
    { value: 'venues', label: 'Venue', icon: Building2 },
    { value: 'jobs', label: 'Job', icon: Briefcase },
  ];

  const handleSearch = () => {
    if (!selectedCategory) return;

    let url = `/${selectedCategory}`;
    
    if (selectedCountry && selectedCountry !== '') {
      url += `?country=${encodeURIComponent(selectedCountry)}`;
    }

    navigate(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-gelica font-bold text-gray-800 mb-2">
          I am looking for
        </h2>
        <p className="text-gray-600">
          Find wellness professionals, events, venues, and opportunities
        </p>
      </div>

      <div className="space-y-4">
        {/* Category Selection */}
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.value;
              
              return (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-accent-text bg-accent-text/5 text-accent-text'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium text-center">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Country Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <MapPin className="inline h-4 w-4 mr-1" />
            Country
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-text/20 focus:border-accent-text transition-colors"
          >
            <option value="">All Countries</option>
            {europeanCountries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!selectedCategory}
          className="w-full flex items-center justify-center px-6 py-4 bg-accent-text hover:bg-accent-text/90 disabled:bg-accent-text/70 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg disabled:shadow-md"
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </button>
      </div>
    </div>
  );
}