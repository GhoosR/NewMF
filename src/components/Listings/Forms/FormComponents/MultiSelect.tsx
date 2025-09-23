import React from 'react';
import { X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
}

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  required
}: MultiSelectProps) {
  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && '*'}
      </label>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selectedValues.map(value => {
            const option = options.find(o => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
              >
                {option?.label}
                <button
                  type="button"
                  onClick={() => handleSelect(value)}
                  className="ml-1 inline-flex items-center p-0.5 hover:bg-indigo-200 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {options.map(option => (
            <label
              key={option.value}
              className="relative flex items-start py-2"
            >
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={() => handleSelect(option.value)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2">{option.label}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}