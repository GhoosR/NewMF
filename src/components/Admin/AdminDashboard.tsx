import React, { useState, useEffect } from 'react';
import { Tabs } from './Tabs';
import { PendingListings } from './PendingListings';
import { ApprovedListings } from './ApprovedListings';
import { RejectedListings } from './RejectedListings';
import { ArticlesTab } from './ArticlesTab';
import { LiveStreamTab } from './LiveStreamTab';
import { SuggestionsTab } from './SuggestionsTab';
import { supabase } from '../../lib/supabase';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState('pending');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(!!data?.is_admin);
    };

    checkAdminStatus();
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-content mb-6">Admin Dashboard</h1>
      
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'pending' && <PendingListings />}
        {activeTab === 'approved' && <ApprovedListings />}
        {activeTab === 'rejected' && <RejectedListings />}
        {activeTab === 'articles' && <ArticlesTab />}
        {activeTab === 'livestream' && <LiveStreamTab />}
        {activeTab === 'suggestions' && <SuggestionsTab />}
      </div>
    </div>
  );
}