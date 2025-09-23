import React, { forwardRef } from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-content/80 mb-1.5">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 
            bg-white 
            border border-accent-text/20 
            rounded-lg
            shadow-sm
            text-content
            focus:border-accent-text 
            focus:ring-1 
            focus:ring-accent-text/20 
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-all duration-200
            hover:border-accent-text/40
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-content/60">{helperText}</p>
        )}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';