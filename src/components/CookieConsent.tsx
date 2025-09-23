import React, { useEffect, useState } from 'react';
import { X, Cookie, ChevronRight } from 'lucide-react';

interface CookieConsentProps {
  onAccept: () => void;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if consent has already been given
    const hasConsent = localStorage.getItem('cookie-consent');
    if (!hasConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Store consent in localStorage with timestamp
    localStorage.setItem('cookie-consent', new Date().toISOString());
    setIsVisible(false);
    onAccept();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out mb-[4.5rem] lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Cookie className="h-6 w-6 text-accent-text" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-content/80">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept", you consent to our use of cookies.
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <a 
                  href="/privacy-policy" 
                  className="inline-flex items-center text-sm text-accent-text hover:text-accent-text/80"
                >
                  Privacy Policy
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
                <a 
                  href="/cookie-policy" 
                  className="inline-flex items-center text-sm text-accent-text hover:text-accent-text/80"
                >
                  Cookie Policy
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleAccept}
              className="px-6 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-2 text-content/60 hover:text-content rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}