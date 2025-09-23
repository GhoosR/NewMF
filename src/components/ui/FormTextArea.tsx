import React, { forwardRef } from 'react';

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const FormTextArea = forwardRef<HTMLTextAreaElement, FormTextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-content/80 mb-1.5">
            {label} {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2.5 
            bg-white 
            border border-accent-text/20 
            rounded-lg
            shadow-sm
            placeholder:text-content/40
            text-content
            focus:border-accent-text 
            focus:ring-1 
            focus:ring-accent-text/20 
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-all duration-200
            hover:border-accent-text/40
            resize-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-content/60">{helperText}</p>
        )}
      </div>
    );
  }
);

FormTextArea.displayName = 'FormTextArea';