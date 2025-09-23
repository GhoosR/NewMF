import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../Search/SearchBar';
import { SubscriptionModal } from '../Subscription/SubscriptionModal';
import NotificationBell from '../Notifications/NotificationBell';
import { supabase } from '../../lib/supabase';
import { isProfessional } from '../../lib/auth/authService';

interface HeaderProps {
  onLogin: () => void;
  isAuthenticated: boolean;
  onMenuClick: () => void;
}

export function Header({ onLogin, isAuthenticated, onMenuClick }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      checkProfessionalStatus();
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUserId(user?.id || null);
      });
    }
  }, [isAuthenticated]);

  const checkProfessionalStatus = async () => {
    const hasProfessionalAccess = await isProfessional();
    setIsPro(hasProfessionalAccess);
  };

  return (
    <header className="sticky top-0 z-20 bg-background border-b border-gray-200">
      <div className="flex items-center h-16 px-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden relative p-3 hover:bg-[#8DA847]/10 rounded-xl group transition-colors"
          aria-label="Open menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className="w-full h-0.5 bg-[#8DA847] rounded-full transition-transform origin-right group-hover:translate-y-0.5"></span>
            <span className="w-full h-0.5 bg-[#8DA847] rounded-full transition-opacity"></span>
            <span className="w-full h-0.5 bg-[#8DA847] rounded-full transition-transform origin-right group-hover:-translate-y-0.5"></span>
          </div>
          <div className="absolute inset-0 bg-[#8DA847]/5 rounded-xl scale-0 group-hover:scale-100 transition-transform" />
        </button>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-auto">
          <SearchBar />
        </div>

        {/* Auth/Upgrade/Notification Buttons */}
        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Message Icon - Desktop Only */}
              <Link
                to="/chat"
                className="hidden lg:flex items-center justify-center p-2 text-accent-text hover:bg-accent-base/20 rounded-full"
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
              
              <NotificationBell />
              {!isPro && (
                <>
                  {/* Desktop Upgrade Button */}
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upgrade to Pro
                  </button>
                  {/* Mobile Upgrade Button */}
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="lg:hidden inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Upgrade
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {/* Desktop Sign In Button */}
              <button
                onClick={onLogin}
                className="hidden lg:inline-flex items-center px-4 py-2 text-sm font-medium text-accent-text border border-accent-text rounded-md hover:bg-accent-text hover:text-white transition-colors"
              >
                Sign in
              </button>
              {/* Mobile Sign In Button */}
              <button
                onClick={onLogin}
                className="lg:hidden inline-flex items-center px-3 py-1.5 text-sm font-medium text-accent-text border border-accent-text rounded-md hover:bg-accent-text hover:text-white transition-colors"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Mobile Search Overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-content">Search</h2>
              <button
                onClick={() => setShowSearch(false)}
                className="p-2 text-content/60 hover:text-content"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <SearchBar onResultClick={() => setShowSearch(false)} />
            </div>
          </div>
        )}

        {/* Subscription Modal */}
        {showUpgradeModal && (
          <SubscriptionModal
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {
              setShowUpgradeModal(false);
              checkProfessionalStatus();
            }}
          />
        )}
      </div>
    </header>
  );
}