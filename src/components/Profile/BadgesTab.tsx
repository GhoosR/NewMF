import React from 'react';
import { BadgeSelector } from '../Badges/BadgeSelector';

interface BadgesTabProps {
  userId: string;
}

export function BadgesTab({ userId }: BadgesTabProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <BadgeSelector userId={userId} />
        </div>
      </div>
    </div>
  );
}

export default BadgesTab;





