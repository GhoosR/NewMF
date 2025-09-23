import React from 'react';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  preserveLineBreaks?: boolean;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  preserveLineBreaks = true,
}: TextAreaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${preserveLineBreaks ? 'whitespace-pre-line' : ''}`}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}