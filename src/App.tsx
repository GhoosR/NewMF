import React, { useEffect, useState } from 'react';
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { HelmetProvider } from 'react-helmet-async';
import { ScrollToTop } from './components/ScrollToTop';
import { supabase } from './lib/supabase';
import { WelcomePopup } from './components/WelcomePopup';
import { NewUserRedirect } from './components/NewUserRedirect';
import { startActivityTracking, stopActivityTracking } from './lib/activity';
import { useSessionRestoration } from './hooks/useSessionRestoration';
import Auth from './components/Auth';
import MainLayout from './components/Layout/MainLayout';
import Cookies from 'js-cookie';
import { Home } from './pages/Home';
import { NewsFeed } from './pages/NewsFeed';
import Profile from './pages/Profile';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { PostPage } from './pages/posts/PostPage';
import { CommunityPostPage } from './pages/posts/CommunityPostPage';
import { SubscriptionSuccess } from './pages/SubscriptionSuccess';

// Lazy load components for better performance
const Practitioners = lazy(() => import('./pages/Practitioners').then(module => ({ default: module.Practitioners })));
const PractitionerDetails = lazy(() => import('./pages/PractitionerDetails').then(module => ({ default: module.PractitionerDetails })));
const Events = lazy(() => import('./pages/Events').then(module => ({ default: module.Events })));
const EventDetails = lazy(() => import('./pages/EventDetails').then(module => ({ default: module.EventDetails })));
const Venues = lazy(() => import('./pages/Venues').then(module => ({ default: module.Venues })));
const VenueDetails = lazy(() => import('./pages/VenueDetails').then(module => ({ default: module.VenueDetails })));
const Jobs = lazy(() => import('./pages/Jobs').then(module => ({ default: module.Jobs })));
const JobDetails = lazy(() => import('./pages/JobDetails').then(module => ({ default: module.JobDetails })));
const Communities = lazy(() => import('./pages/Communities').then(module => ({ default: module.Communities })));
const CommunityDetails = lazy(() => import('./pages/CommunityDetails').then(module => ({ default: module.CommunityDetails })));
const Courses = lazy(() => import('./pages/Courses').then(module => ({ default: module.Courses })));
const CourseDetails = lazy(() => import('./pages/CourseDetails').then(module => ({ default: module.CourseDetails })));
const CourseLessons = lazy(() => import('./pages/CourseLessons'));
const Recipes = lazy(() => import('./pages/Recipes').then(module => ({ default: module.Recipes })));
const RecipeDetails = lazy(() => import('./pages/RecipeDetails').then(module => ({ default: module.RecipeDetails })));
const RecipeRedirect = lazy(() => import('./components/Recipes/RecipeRedirect').then(module => ({ default: module.RecipeRedirect })));
const Nutrition = lazy(() => import('./pages/tools/Nutrition').then(module => ({ default: module.Nutrition })));
const CorporateWellness = lazy(() => import('./pages/CorporateWellness').then(module => ({ default: module.CorporateWellness })));
const Blogs = lazy(() => import('./pages/Blogs').then(module => ({ default: module.Blogs })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Articles = lazy(() => import('./pages/Articles').then(module => ({ default: module.Articles })));
const ArticleDetails = lazy(() => import('./pages/ArticleDetails').then(module => ({ default: module.ArticleDetails })));
const LiveStream = lazy(() => import('./pages/LiveStream').then(module => ({ default: module.LiveStream })));
const Agriculture = lazy(() => import('./pages/Agriculture'));
const FieldDetails = lazy(() => import('./pages/FieldDetails').then(module => ({ default: module.FieldDetails })));
const Features = lazy(() => import('./pages/Features').then(module => ({ default: module.Features })));
const Tutorials = lazy(() => import('./pages/Tutorials').then(module => ({ default: module.Tutorials })));
const Chat = lazy(() => import('./pages/Chat'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfService = lazy(() => import('./pages/TermsOfService').then(module => ({ default: module.TermsOfService })));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy').then(module => ({ default: module.CookiePolicy })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(module => ({ default: module.ResetPassword })));
const Advertise = lazy(() => import('./pages/Advertise').then(module => ({ default: module.Advertise })));
const Notifications = lazy(() => import('./pages/Notifications').then(module => ({ default: module.Notifications })));
const AboutUs = lazy(() => import('./pages/AboutUs').then(module => ({ default: module.AboutUs })));
const Suggestions = lazy(() => import('./pages/Suggestions').then(module => ({ default: module.Suggestions })));

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize session restoration for iOS WebViews
  const { 
    isRestoring, 
    isIOSWebView, 
    sessionRestored, 
    error: restorationError,
    isAppRestart,
    appLevelRestoration
  } = useSessionRestoration();

  // Extract OneSignal ID from URL and store in cookie
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const onesignalId = params.get('onesignal_push_id');
    
    if (onesignalId) {
      // Store in cookie that expires in 1 year
      Cookies.set('onesignal_id', onesignalId, { expires: 365 });
      
      // Remove the parameter from URL without reloading
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
    
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        startActivityTracking();
      }
      if (session?.user) {
        // Update OneSignal ID if it exists in cookie
        const onesignalId = Cookies.get('onesignal_id');
        if (onesignalId) {
          supabase
            .from('users')
            .update({ onesignal_id: onesignalId })
            .eq('id', session.user.id)
            .then(({ error }) => {
              if (!error) {
                // Only remove cookie if update was successful
                Cookies.remove('onesignal_id');
              }
            });
        }

        // Note: New user redirect is now handled by NewUserRedirect component
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Note: New user redirect is now handled by NewUserRedirect component
      setSession(session);
      if (session) {
        setShowAuth(false);
        startActivityTracking();
      } else {
        stopActivityTracking();
      }

      // Update OneSignal ID if it exists in cookie
      if (session?.user) {
        const onesignalId = Cookies.get('onesignal_id');
        if (onesignalId) {
          supabase
            .from('users')
            .update({ onesignal_id: onesignalId })
            .eq('id', session.user.id)
            .then(({ error }) => {
              if (!error) {
                // Only remove cookie if update was successful
                Cookies.remove('onesignal_id');
              }
            });
        }
      }
    });

    // Listen for custom event to show auth modal
    const handleShowAuth = () => setShowAuth(true);
    window.addEventListener('show-auth', handleShowAuth);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('show-auth', handleShowAuth);
    };
  }, []);

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
    </div>
  );

  // Enhanced loading component for iOS WebView session restoration
  const IOSWebViewLoadingFallback = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      {isRestoring && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            {appLevelRestoration ? 'Restoring session after app restart...' : 'Restoring session...'}
          </p>
          {isAppRestart && (
            <p className="text-xs text-gray-500">
              App was restarted, recovering your session
            </p>
          )}
        </div>
      )}
      {sessionRestored && (
        <p className="text-sm text-green-600 text-center">
          {isAppRestart ? 'Session restored after app restart!' : 'Session restored successfully'}
        </p>
      )}
      {restorationError && (
        <div className="text-center space-y-2">
          <p className="text-sm text-red-600">
            Session restoration failed. Please try logging in again.
          </p>
          {isAppRestart && (
            <p className="text-xs text-gray-500">
              This can happen when the app was closed for a long time
            </p>
          )}
        </div>
      )}
    </div>
  );
  return (
    <HelmetProvider>
      <Router>
        <ScrollToTop />
        <div className="h-screen flex flex-col bg-background text-content">
          {showAuth && !session ? (
            <Auth onClose={() => setShowAuth(false)} />
          ) : null}
          
          {showWelcome && (
            <WelcomePopup onClose={() => setShowWelcome(false)} />
          )}
          
          <MainLayout 
            onLogin={() => setShowAuth(true)}
            isAuthenticated={!!session}
          >
            <NewUserRedirect />
            <Suspense fallback={isIOSWebView ? <IOSWebViewLoadingFallback /> : <LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={session ? <NewsFeed /> : <Home />} />
              <Route path="/practitioners" element={<Practitioners />} />
              <Route path="/practitioners/:slug" element={<PractitionerDetails />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetails />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venues/:slug" element={<VenueDetails />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:slug" element={<JobDetails />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/id/:id" element={<RecipeRedirect />} />
              <Route path="/recipes/:slug" element={<RecipeDetails />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/articles/:slug" element={<ArticleDetails />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:slug" element={<BlogPost />} />
              <Route path="/corporate-wellness" element={<CorporateWellness />} />
              <Route path="/tools/nutrition" element={<Nutrition />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/agriculture" element={<Agriculture />} />
              <Route path="/agriculture/:id" element={<FieldDetails />} />
              <Route path="/chat/:userId" element={<Chat />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/advertise" element={<Advertise />} />
              <Route path="/features" element={<Features />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/live-stream" element={<LiveStream />} />
              <Route path="/suggestions" element={<Suggestions />} />

              {/* Protected Routes - Require Authentication */}
              {session ? (
                <>
                  <Route path="/communities/:id/*" element={<CommunityDetails />} />
                  <Route path="/communities/posts/:id" element={<CommunityPostPage />} />
                  <Route path="/posts/:id" element={<PostPage />} />
                  <Route path="/courses/:id/learn" element={<CourseLessons />} />
                  <Route path="/profile/:username/*" element={<Profile />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/chat/:userId" element={<Chat />} />
                </>
              ) : null}
            </Routes>
            </Suspense>
          </MainLayout>
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App