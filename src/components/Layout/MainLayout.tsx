import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CookieConsent } from '../CookieConsent';
import { MobileNav } from './MobileNav';
import { MobileBottomNav } from './MobileBottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogin: () => void;
  isAuthenticated: boolean;
}

function MainLayout({ children, onLogin, isAuthenticated }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileNav] = useState(true);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50">
      <CookieConsent onAccept={() => {}} />
      
      {/* Mobile Menu */}
      <div className="lg:hidden">
        <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="lg:pl-64 transition-all duration-300 flex flex-col h-screen">
        <Header 
          onLogin={onLogin} 
          isAuthenticated={isAuthenticated}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto relative pb-16 lg:pb-0">
          {children}
        </main>
        <MobileBottomNav />
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center space-y-6">
              {/* Copyright and Links */}
              <div className="text-center text-sm text-content/60">
                <p>© {currentYear} Mindful Family. All rights reserved.</p>
                <div className="mt-2 space-x-4">
                  <Link to="/privacy-policy" className="hover:text-content">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link to="/corporate-wellness" className="hover:text-content">
                    Corporate Wellness
                  </Link>
                  <span>•</span>
                  <Link to="/suggestions" className="hover:text-content">
                    Suggestions
                  </Link>
                  <span>•</span>
                  <Link to="/features" className="hover:text-content">
                    Features
                  </Link>
                  <span>•</span>
                  <Link to="/tutorials" className="hover:text-content">
                    Tutorials
                  </Link>
                  <span>•</span>
                  <Link to="/advertise" className="hover:text-content">
                    Advertise
                  </Link>
                  <span>•</span>
                  <Link to="/terms" className="hover:text-content">
                    Terms of Service
                  </Link>
                  <span>•</span>
                  <Link to="/about" className="hover:text-content">
                    About Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MainLayout;