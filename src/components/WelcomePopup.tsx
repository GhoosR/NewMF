import React from 'react';
import { X, Users, Calendar, Building2, Video, Gift, ArrowRight } from 'lucide-react';
import { SubscriptionButton } from './Subscription';

export function WelcomePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto my-4 sm:my-8 overflow-hidden">
        {/* Header */}
        <div className="relative h-32 sm:h-48 overflow-hidden">
          <img
            src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Mindful%20Family%20Wellness%20Hub%20Signup%20-%20Lady%20walking%20in%20grass%20barefeet.webp"
            alt="Welcome to Mindful Family"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl sm:text-3xl font-gelica font-bold text-white text-center px-4">
              Welcome to Mindful Family!
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-base sm:text-lg text-content/80 text-center mb-4 sm:mb-6">
            Upgrade to Professional to unlock all features and start your wellness journey today.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-accent-base/5 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-accent-text mr-2" />
                <h3 className="font-medium text-sm text-content">Create Listings</h3>
              </div>
              <p className="text-xs text-content/70 line-clamp-2">
                List services, events & venues
              </p>
            </div>

            <div className="bg-accent-base/5 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-accent-text mr-2" />
                <h3 className="font-medium text-sm text-content">Host Events</h3>
              </div>
              <p className="text-xs text-content/70 line-clamp-2">
                Organize wellness events
              </p>
            </div>

            <div className="bg-accent-base/5 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center mb-2">
                <Building2 className="h-4 w-4 text-accent-text mr-2" />
                <h3 className="font-medium text-sm text-content">Communities</h3>
              </div>
              <p className="text-xs text-content/70 line-clamp-2">
                Build your own community
              </p>
            </div>

            <div className="bg-accent-base/5 rounded-lg p-2.5 sm:p-3">
              <div className="flex items-center mb-2">
                <Video className="h-4 w-4 text-accent-text mr-2" />
                <h3 className="font-medium text-sm text-content">Live Streams</h3>
              </div>
              <p className="text-xs text-content/70 line-clamp-2">
                Daily wellness content
              </p>
            </div>
          </div>

          <div className="bg-accent-base/10 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-6">
            <div className="flex items-center mb-1">
              <Gift className="h-4 w-4 text-accent-text mr-2" />
              <h3 className="font-medium text-sm text-content">Special Offer</h3>
            </div>
            <p className="text-xs text-content/70 line-clamp-2">
              Get exclusive partner discounts when you upgrade to Professional
            </p>
          </div>

          <div className="flex flex-col items-center">
            <SubscriptionButton className="w-full sm:max-w-sm" />
            <button
              onClick={onClose}
              className="mt-3 text-sm text-content/60 hover:text-content transition-colors py-2"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}