import React from 'react';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs = [
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'articles', label: 'Articles' },
    { id: 'livestream', label: 'Live Stream' },
    { id: 'suggestions', label: 'Suggestions' }
  ];

  return (
    <div className="border-b border-accent-text/10">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${
              activeTab === tab.id
                ? 'border-accent-text text-accent-text'
                : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}