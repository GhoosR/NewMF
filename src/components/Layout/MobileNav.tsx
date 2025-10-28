import React from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { X, LogOut } from 'lucide-react';
import { useAdmin } from '../../lib/hooks/useAdmin';
import { Logo } from '../Logo';
import { socialItems, discoverItems, learnItems, toolsItems } from '../../lib/constants/navigationItems';
import { Avatar } from '../Profile/Avatar';
import { supabase } from '../../lib/supabase';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const [profile, setProfile] = React.useState<any>(null);

  React.useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    }

    if (isOpen) {
      getProfile();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!isOpen) return null;

  const renderNavItem = (item: typeof socialItems[0], index: number) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const delay = `delay-[${index * 50}ms]`;
    
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 ${
          isActive 
            ? 'bg-[#8DA847] text-white' 
            : 'hover:bg-[#8DA847]/10'
        } animate-fade-in ${delay}`}
      >
        <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-[#8DA847]'}`} />
        <span className={`text-lg ${isActive ? 'text-white' : 'text-content'}`}>
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white h-full w-full flex flex-col pb-16">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#8DA847]/10">
          <Link 
            to="/" 
            className="flex items-center space-x-2"
            onClick={onClose}
          >
            <div className="p-2 bg-[#8DA847]/10 rounded-xl">
              <Logo className="h-12 w-12 text-[#8DA847]" />
            </div>
            <span className="text-xl font-gelica font-bold text-content">
              Mindful Family
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#8DA847]/10 rounded-xl transition-colors"
          >
            <X className="h-6 w-6 text-[#8DA847]" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {/* Social */}
          <div className="space-y-2">
            {socialItems.map((item, index) => renderNavItem(item, index))}
          </div>

          {/* Discover */}
          <div>
            <h3 className="px-6 text-sm font-medium text-[#8DA847] uppercase tracking-wider mb-2">
              Discover
            </h3>
            <div className="space-y-2">
              {discoverItems.map((item, index) => renderNavItem(item, index + socialItems.length))}
            </div>
          </div>

          {/* Learn */}
          <div>
            <h3 className="px-6 text-sm font-medium text-[#8DA847] uppercase tracking-wider mb-2">
              Learn
            </h3>
            <div className="space-y-2">
              {learnItems.map((item, index) => renderNavItem(item, index + socialItems.length + discoverItems.length))}
            </div>
          </div>

          {/* Tools */}
          <div>
            <h3 className="px-6 text-sm font-medium text-[#8DA847] uppercase tracking-wider mb-2">
              Tools
            </h3>
            <div className="space-y-2">
              {toolsItems.map((item, index) => renderNavItem(item, index + socialItems.length + discoverItems.length + learnItems.length))}
            </div>
          </div>

          {/* Admin */}
          {isAdmin && (
            <div>
              <h3 className="px-6 text-sm font-medium text-[#8DA847] uppercase tracking-wider mb-2">
                Admin
              </h3>
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center space-x-3 px-6 py-4 rounded-xl hover:bg-[#8DA847]/10 animate-fade-in"
              >
                <span className="h-5 w-5">⚙️</span>
                <span className="text-lg text-content">Dashboard</span>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto p-6 border-t border-[#8DA847]/10 bg-white animate-fade-in">
          {profile ? (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-6 py-3 space-x-2 bg-[#8DA847]/10 rounded-xl text-[#8DA847] hover:bg-[#8DA847]/20 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('show-auth'));
                onClose();
              }}
              className="flex items-center justify-center w-full px-6 py-3 space-x-2 bg-[#8DA847] text-white rounded-xl hover:bg-[#8DA847]/90 transition-colors"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}