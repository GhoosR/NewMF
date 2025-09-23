import React from 'react';

interface FilterCheckboxProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}

export function FilterCheckbox({ label, value, checked, onChange }: FilterCheckboxProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChange(value)}
        className="rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
      />
      <span className="text-sm text-content">{label}</span>
    </label>
  );
}