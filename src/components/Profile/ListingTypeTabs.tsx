import React, { useRef } from 'react';

interface ListingTypeTabsProps {
  activeType: string;
  onTypeChange: (type: string) => void;
}

export function ListingTypeTabs({ activeType, onTypeChange }: ListingTypeTabsProps) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      const currentTypeIndex = types.findIndex(type => type.id === activeType);

      if (swipeDistance > 0 && currentTypeIndex > 0) {
        // Swipe right - go to previous type
        onTypeChange(types[currentTypeIndex - 1].id);
      } else if (swipeDistance < 0 && currentTypeIndex < types.length - 1) {
        // Swipe left - go to next type
        onTypeChange(types[currentTypeIndex + 1].id);
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const types = [
    { id: 'all', label: 'All' },
    { id: 'practitioners', label: 'Practitioners' },
    { id: 'events', label: 'Events' },
    { id: 'venues', label: 'Venues' },
    { id: 'jobs', label: 'Jobs' },
  ];

  return (
    <div 
      ref={tabsRef}
      className="border-b border-accent-text/10 mb-6 overflow-x-auto scrollbar-hide"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <nav className="-mb-px flex space-x-8">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`${
              activeType === type.id
                ? 'border-accent-text text-accent-text'
                : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            {type.label}
          </button>
        ))}
      </nav>
    </div>
  );
}