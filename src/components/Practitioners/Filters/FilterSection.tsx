import React from 'react';

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-content mb-2">{title}</h3>
      {children}
    </div>
  );
}