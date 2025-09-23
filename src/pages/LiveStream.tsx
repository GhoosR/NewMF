import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, User, AlertCircle, UserX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Meta } from '../components/Meta';
import { Auth } from '../components/Auth';
import { SubscriptionButton } from '../components/Subscription';
import { LiveChat } from '../components/LiveStream/LiveChat';

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function LiveStream() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    // Convert Sunday (0) to 6, and shift Monday-Saturday (1-6) to 0-5
    return today === 0 ? 6 : today - 1;
  });
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        setIsAuthenticated(!!user);

        if (!user) {
          setLoading(false);
          return;
        }

        // Check if user has professional subscription
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, user_type, is_admin')
          .eq('id', user.id)
          .single();

        setIsPro(
          userData?.user_type === 'professional' && 
          userData?.subscription_status === 'active'
        );
        setIsAdmin(!!userData?.is_admin);

        setLoading(false);

        // Fetch schedule
        const { data: scheduleData } = await supabase
          .from('livestream_schedule')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('time', { ascending: true });

        setSchedule(scheduleData || []);
      } catch (err) {
        console.error('Error checking access:', err);
        setError('Failed to load stream settings');
        setLoading(false);
      }
    };

    checkAccess();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-b from-[#F3F7EE] to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <Video className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Join Our Daily Live Streams
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Connect with wellness experts in our daily live sessions. Get real-time answers to your questions and participate in guided practices.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
            >
              Sign in to Join Live Streams
            </button>
            <p className="text-sm text-content/60">
              Don't have an account? <button onClick={() => setShowAuthModal(true)} className="text-accent-text hover:text-accent-text/80">Create one now</button>
            </p>
          </div>
        </div>

        {showAuthModal && (
          <Auth onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-accent-base/10 rounded-full">
              <Video className="h-12 w-12 text-accent-text" />
            </div>
          </div>
          <h1 className="text-4xl font-gelica font-bold text-content mb-6">
            Upgrade to Join Live Streams
          </h1>
          <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto">
            Get access to live streams every other day with wellness experts, including:
          </p>
          <ul className="text-left max-w-md mx-auto mb-8 space-y-4">
            <li className="flex items-center text-content/80">
              <span className="w-2 h-2 bg-accent-text rounded-full mr-3"></span>
              Guided meditation and yoga sessions
            </li>
            <li className="flex items-center text-content/80">
              <span className="w-2 h-2 bg-accent-text rounded-full mr-3"></span>
              Nutrition and wellness Q&As
            </li>
            <li className="flex items-center text-content/80">
              <span className="w-2 h-2 bg-accent-text rounded-full mr-3"></span>
              Expert interviews and workshops
            </li>
            <li className="flex items-center text-content/80">
              <span className="w-2 h-2 bg-accent-text rounded-full mr-3"></span>
              Interactive community discussions
            </li>
          </ul>
          <SubscriptionButton className="w-full max-w-md mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Meta 
        title="Live Stream | Mindful Family"
        description="Join our live wellness sessions for real-time interaction with experts and community members."
      />

      {/* Header Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-gelica font-bold text-content mb-4">
          Live Wellness Sessions
        </h1>
        <p className="text-xl text-content/70 max-w-3xl mx-auto">
          Join our daily live sessions with expert practitioners. Experience guided meditations,
          yoga flows, wellness talks, and interactive Q&As.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <iframe 
              src="https://lvpr.tv?v=0ac7ed7jb0oosaif" 
              className="w-full h-full"
              frameBorder="0" 
              allowFullScreen 
              allow="autoplay; encrypted-media; picture-in-picture" 
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
          
          {/* Schedule Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-content">Weekly Schedule</h2>
            </div>
            
            {/* Day Selector */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
              {DAYS.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setCurrentDay(index)}
                  className={`flex-shrink-0 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                    currentDay === index
                      ? 'border-accent-text text-accent-text'
                      : 'border-transparent text-content/60 hover:text-content hover:border-content/20'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            
            {/* Sessions List */}
            <div className="divide-y divide-gray-100">
              {schedule
                .filter(item => {
                  // Convert our 0-6 (Mon-Sun) to database 0-6 (Sun-Sat)
                  const dbDay = currentDay === 6 ? 0 : currentDay + 1;
                  return item.day_of_week === dbDay;
                })
                .map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-content">{item.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-content/60">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {item.time}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {item.host}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              {schedule.filter(item => {
                const dbDay = currentDay === 6 ? 0 : currentDay + 1;
                return item.day_of_week === dbDay;
              }).length === 0 && (
                <div className="p-4 text-center text-content/60">
                  No sessions scheduled for this day
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Chat */}
        <div className="lg:col-span-1">
          <LiveChat 
            onSignInClick={() => setShowAuthModal(true)}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}