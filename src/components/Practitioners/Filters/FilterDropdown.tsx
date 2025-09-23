import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiSelect?: boolean;
}

export function FilterDropdown({ 
  label, 
  options, 
  selectedValues, 
  onChange,
  multiSelect = true
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (!multiSelect) {
      // For single select, just replace the value
      onChange([value]);
      setIsOpen(false);
      return;
    }

    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const getDisplayValue = () => {
    if (selectedValues.length === 0) return label;
    
    if (!multiSelect) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : label;
    }

    return `${label} (${selectedValues.length})`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm bg-white border border-accent-text/20 rounded-lg hover:border-accent-text/40 focus:outline-none focus:ring-2 focus:ring-accent-text/20"
      >
        <span className="truncate">{getDisplayValue()}</span>
        <ChevronDown className={`h-4 w-4 text-accent-text/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-2 bg-white border border-accent-text/20 rounded-lg shadow-lg">
          <div className="p-2 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center px-2 py-1.5 hover:bg-accent-base/20 rounded cursor-pointer"
              >
                <input
                  type={multiSelect ? "checkbox" : "radio"}
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className={`mr-2 ${
                    multiSelect 
                      ? "rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
                      : "text-accent-text focus:ring-accent-text"
                  }`}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}