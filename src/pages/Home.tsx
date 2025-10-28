import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users,
  Calendar, 
  BookOpen, 
  ArrowRight,
  Globe,
  Star,
  Plus,
  BadgeCheck,
  CreditCard,
  HelpCircle,
  Zap,
  Building,
  CheckCircle,
  MessageSquare,
  Video,
  TreePine,
  MessageCircle
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Pagination, Autoplay } from 'swiper/modules';
import { Auth } from '../components/Auth';
import { SearchBox } from '../components/SearchBox';
import Lottie from 'lottie-react';

export function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [liveStreamAnimation, setLiveStreamAnimation] = useState(null);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  useEffect(() => {
    // Load the live stream Lottie animation
    fetch('/lottie-live-stream.json')
      .then(response => response.json())
      .then(data => setLiveStreamAnimation(data))
      .catch(error => console.error('Error loading live stream Lottie animation:', error));
  }, []);

  // Component to render Lottie animation with fallback
  const LottieIcon = ({ 
    animationData, 
    fallbackIcon: FallbackIcon, 
    className = "h-8 w-8" 
  }: { 
    animationData: any; 
    fallbackIcon: any; 
    className?: string; 
  }) => {
    if (animationData) {
      return (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: 64, height: 64 }}
          className="lottie-animation"
        />
      );
    }
    return <FallbackIcon className={className} />;
  };

  const spotlightPractitioners = [
  {
    name: "Bee Ingram",
    title: "Yoga Teacher",
    image: "https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/bee%20ingram%20yoga%20teacher.jpeg",
  },
  {
    name: "Marta De Ferrari",
    title: "Ayurveda Practitioner",
    image: "https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Marta-ayurveda-practitioner.webp",
  },
  {
    name: "Phoebe Grant",
    title: "Birth Doula",
    image: "https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Birth%20Doula%20-phoebe%20-grant.jpg",
  }
];


  const benefits = [
  {
    icon: Video,
    title: "Live Streaming",
    description: "Join our interactive wellness sessions multiple times a week with expert practitioners. From yoga and meditation to nutrition talks, engage in real-time with our global community.",
    size: "large",
    animationData: liveStreamAnimation
  },
  {
    icon: Star,
    title: "Connect with Wellness Professionals",
    description: "Discover practitioners, venues, job opportunities and events that align with your Wellness journey.",
    size: "small"
  },
  {
    icon: MessageCircle,
    title: "Build Your Own Community",
    description: "Create and nurture connections with like-minded individuals who share your passion for mindful living.",
    size: "small"
  },
  {
    icon: BookOpen,
    title: "Learn and Grow Together",
    description: "Access comprehensive courses and educational resources designed to deepen your knowledge and enhance your wellness practice.",
    size: "large"
  },
  {
    icon: TreePine,
    title: "Permaculture Tools",
    description: "Discover sustainable living tools and resources to create regenerative ecosystems and live in harmony with nature.",
    size: "small"
  }
];

  const faqs = [
  {
    question: 'How do I create a listing?',
    answer: 'To list your wellness services, venues, or events, go to your profile, select the "Listings" tab, and click "Add Listing." Choose your category, input the details, and publish.',
    icon: Plus
  },
  {
    question: 'What does the blue check mark mean?',
    answer: 'A blue check mark indicates that a practitioner has been verified and holds a valid certification, ensuring credibility within the global wellness platform.',
    icon: BadgeCheck
  },
  {
    question: 'Can I cancel my membership at any time?',
    answer: 'Yes, you can cancel your membership at any time with ease. Your experience remains flexible and hassle-free.',
    icon: CreditCard
  },
  {
    question: 'I have more questions, can you help me?',
    answer: 'For additional inquiries, reach out to us at support@mindful.family. We\'re here to assist you in building a better wellness community.',
    icon: HelpCircle
  }
];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section - Redesigned with full-width background and centered content */}
      <section className="relative bg-gradient-to-b from-[#F3F7EE] to-[#F3F7EE]/50 py-16 md:py-24 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
          <div className="absolute w-64 h-64 rounded-full bg-accent-text/10 -top-20 -right-20"></div>
          <div className="absolute w-48 h-48 rounded-full bg-accent-text/10 bottom-40 right-20"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-6 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-gelica leading-tight mb-6 animate-fade-in" style={{ color: '#2F4F3E' }}>
                Connect, Grow, and Thrive in a Global Wellness Community
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto lg:mx-0 animate-fade-in delay-100" style={{ color: '#5A6B5A' }}>
              Connect with verified wellness practitioners, join live-streamed wellness sessions, and build meaningful relationships in wellness communities worldwide.              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in delay-200">
                <button 
                  onClick={handleGetStarted}
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-[#8DA847] hover:bg-[#7A9339] transition-colors shadow-md hover:shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
                <button 
                  onClick={() => {
                    const searchSection = document.getElementById('search-section');
                    if (searchSection) {
                      searchSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center px-8 py-4 border-2 border-[#8DA847] text-lg font-medium rounded-xl text-[#8DA847] hover:bg-[#8DA847] hover:text-white transition-colors"
                >
                  Explore
                </button>
              </div>
              
              {/* App Download Icons */}
              <div className="flex items-center justify-center lg:justify-start space-x-4 mt-6 animate-fade-in delay-300">
                <a
                  href="#"
                  className="inline-block hover:opacity-80 transition-opacity"
                  title="Download on the App Store"
                >
                  <div className="w-40 h-12 bg-blue-700 rounded-lg flex items-center justify-center px-3 hover:bg-gray-800 transition-colors">

                    <svg className="w-6 h-6 text-white mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/80 leading-tight">Download on the</div>
                      <div className="text-sm font-semibold text-white leading-tight">App Store</div>
                    </div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.webviewgold.mindfulfamily&pcampaignid=web_share"
                  className="inline-block hover:opacity-80 transition-opacity"
                  title="Get it on Google Play"
                >
                  <div className="w-40 h-12 bg-gray-900 rounded-lg flex items-center justify-center px-3 hover:bg-gray-800 transition-colors">

                    <svg className="w-6 h-6 text-white mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-white/80 leading-tight">GET IT ON</div>
                      <div className="text-sm font-semibold text-white leading-tight">Google Play</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-6 mt-12 lg:mt-0 flex justify-center lg:justify-end items-center animate-fade-in delay-300">
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-accent-text/10 rounded-full"></div>
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent-text/10 rounded-full"></div>
                <img 
                  src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/connetion-platform-wellness.png"
                  alt="Wellness"
                  className="rounded-xl w-full max-w-lg h-auto object-cover shadow-xl relative z-10"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search-section" className="relative bg-gradient-to-b from-[#F3F7EE]/50 to-white py-16 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute w-96 h-96 rounded-full bg-accent-text/10 -top-48 -left-48"></div>
          <div className="absolute w-64 h-64 rounded-full bg-accent-text/10 top-20 right-20"></div>
          <div className="absolute w-80 h-80 rounded-full bg-accent-text/10 bottom-0 left-1/2 transform -translate-x-1/2"></div>
        </div>
        
        {/* Connecting Line */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-16 bg-gradient-to-b from-accent-text/20 to-transparent"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SearchBox />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-[#F3F7EE] relative">
        <div className="absolute left-0 top-0 w-full h-32 bg-gradient-to-b from-white to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-gelica font-bold mb-6" style={{ color: '#2F4F3E' }}>
              Transform Your Wellness Journey
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: '#5A6B5A' }}>
              Experience the benefits of our holistic wellness platform
            </p>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            {/* First Row: 1 large + 1 small */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
              <div className="lg:col-span-2">
                {(() => {
                  const benefit = benefits[0]; // Live Streaming (large)
                  const Icon = benefit.icon;
                  return (
                    <div 
                      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 transform hover:-translate-y-1 h-full group"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-text/10 text-accent-text mb-6 transition-transform duration-300 group-hover:scale-110">
                        <LottieIcon 
                          animationData={benefit.animationData} 
                          fallbackIcon={Icon} 
                          className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" 
                        />
                      </div>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: '#2F4F3E' }}>
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed text-lg" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="lg:col-span-1">
                {(() => {
                  const benefit = benefits[1]; // Connect with Professionals (small)
                  const Icon = benefit.icon;
                  return (
                    <div 
                      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 transform hover:-translate-y-1 h-full group"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-text/10 text-accent-text mb-6 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#2F4F3E' }}>
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Second Row: 1 small + 1 large + 1 small */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1">
                {(() => {
                  const benefit = benefits[2]; // Build Community (small)
                  const Icon = benefit.icon;
                  return (
                    <div 
                      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 transform hover:-translate-y-1 h-full group"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-text/10 text-accent-text mb-6 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#2F4F3E' }}>
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="lg:col-span-1">
                {(() => {
                  const benefit = benefits[3]; // Learn and Grow (large)
                  const Icon = benefit.icon;
                  return (
                    <div 
                      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 transform hover:-translate-y-1 h-full group"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-text/10 text-accent-text mb-6 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4" style={{ color: '#2F4F3E' }}>
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed text-lg" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
              <div className="lg:col-span-1">
                {(() => {
                  const benefit = benefits[4]; // Permaculture Tools (small)
                  const Icon = benefit.icon;
                  return (
                    <div 
                      className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 transform hover:-translate-y-1 h-full group"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-text/10 text-accent-text mb-6 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="h-8 w-8 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                        <h3 className="text-xl font-bold mb-4" style={{ color: '#2F4F3E' }}>
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Mobile Swiper */}
          <div className="lg:hidden">
            <Swiper
              slidesPerView={1.2}
              centeredSlides={true}
              spaceBetween={20}
              pagination={{ clickable: true }}
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              loop={true}
              className="pb-12"
            >
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <SwiperSlide key={index}>
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5 h-full">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-text/10 text-accent-text mb-4">
                        <LottieIcon 
                          animationData={benefit.animationData} 
                          fallbackIcon={Icon} 
                          className="h-7 w-7" 
                        />
                      </div>
                      <h3 className="text-lg font-bold style={{ color: '#2F4F3E' }} mb-3">
                        {benefit.title}
                      </h3>
                        <p className="leading-relaxed text-sm" style={{ color: '#5A6B5A' }}>
                        {benefit.description}
                      </p>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </section>

      {/* Live Stream Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F3F7EE] to-transparent"></div>
        <div className="absolute -left-32 top-1/4 w-64 h-64 rounded-full bg-accent-text/5"></div>
        <div className="absolute -right-32 bottom-1/4 w-96 h-96 rounded-full bg-accent-text/5"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-full mb-6">
                <span className="animate-pulse h-2 w-2 bg-red-600 rounded-full mr-2"></span>
                <span className="text-sm font-medium">LIVE NOW</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-gelica font-bold style={{ color: '#2F4F3E' }} mb-6">
                Join Our Live Wellness Sessions
              </h2>
              
              <p className="text-xl style={{ color: '#5A6B5A' }} mb-8 leading-relaxed">
                Experience interactive wellness sessions 3-4 times a week with our expert practitioners. From yoga and pilates to meditation and nutrition talks, engage in real-time with our community.
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                    <Calendar className="h-6 w-6 text-accent-text" />
                  </div>
                  <div>
                    <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Regular Schedule</h3>
                    <p className="text-sm style={{ color: '#5A6B5A' }}">Multiple sessions every week</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-accent-text" />
                  </div>
                  <div>
                    <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Expert Instructors</h3>
                    <p className="text-sm style={{ color: '#5A6B5A' }}">Learn from certified professionals</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                    <MessageSquare className="h-6 w-6 text-accent-text" />
                  </div>
                  <div>
                    <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Interactive Chat</h3>
                    <p className="text-sm style={{ color: '#5A6B5A' }}">Ask questions in real-time</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                    <BookOpen className="h-6 w-6 text-accent-text" />
                  </div>
                  <div>
                    <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Diverse Topics</h3>
                    <p className="text-sm style={{ color: '#5A6B5A' }}">From yoga to nutrition</p>
                  </div>
                </div>
              </div>
              
              <Link
                to="/live-stream"
                className="inline-flex items-center px-8 py-4 text-white bg-accent-text rounded-xl shadow-md hover:shadow-lg hover:bg-accent-text/90 transition-all"
              >
                Join Live Sessions
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-text/20 to-transparent rounded-xl transform rotate-3"></div>
              <img 
                src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/livestreampic.png" 
                alt="Live wellness session" 
                className="rounded-xl shadow-xl relative z-10 transform -rotate-3 hover:rotate-0 transition-transform duration-500"
              />
              <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium z-20 animate-pulse">
                LIVE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Practitioners */}
      <section className="py-24 bg-[#F3F7EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xl md:text-4xl font-gelica font-bold style={{ color: '#2F4F3E' }} mb-6">
              Featured Practitioners
            </h2>
            <p className="text-xl style={{ color: '#5A6B5A' }} max-w-3xl mx-auto">
              Connect with our top-rated wellness experts
            </p>
          </div>

          {/* Swiper Carousel */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
            {spotlightPractitioners.map((practitioner, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={practitioner.image}
                    alt={practitioner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-6 relative">
                  <div className="absolute -top-4 left-6 bg-accent-text text-white px-4 py-2 rounded-lg shadow-md z-10">
                    <span className="font-medium text-sm">{practitioner.title}</span>
                  </div>
                  <h3 className="text-xl font-bold style={{ color: '#2F4F3E' }} mt-6 mb-3">
                    {practitioner.name}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm style={{ color: '#2F4F3E' }}/60">Verified Expert</span>
                    <button className="text-accent-text hover:text-accent-text/80 text-sm font-medium">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Mobile Swiper */}
          <div className="md:hidden">
            <Swiper
              slidesPerView={1.2}
              centeredSlides={true}
              spaceBetween={20}
              pagination={{ clickable: true }}
              modules={[Pagination, Autoplay]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              loop={true}
              className="pb-12"
            >
              {spotlightPractitioners.map((practitioner, index) => (
                <SwiperSlide key={index}>
                  <div className="bg-white rounded-xl shadow-md overflow-hidden h-full">
                    <div className="relative h-48">
                      <img
                        src={practitioner.image}
                        alt={practitioner.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-1/2"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className="font-medium text-sm bg-accent-text/80 px-2 py-1 rounded">
                          {practitioner.title}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold style={{ color: '#2F4F3E' }} mb-1">
                        {practitioner.name}
                      </h3>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs style={{ color: '#2F4F3E' }}/60">Verified Expert</span>
                        <button className="text-accent-text hover:text-accent-text/80 text-xs font-medium">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/practitioners"
              className="inline-flex items-center px-6 py-3 border-2 border-accent-text text-accent-text hover:bg-accent-text hover:text-white rounded-xl transition-colors font-medium"
            >
              View All Practitioners
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Corporate Wellness CTA */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F3F7EE] to-transparent"></div>
        <div className="absolute -right-64 top-1/3 w-96 h-96 rounded-full bg-accent-text/5 blur-3xl"></div>
        <div className="absolute -left-64 bottom-1/3 w-96 h-96 rounded-full bg-accent-text/5 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-8 lg:p-12 border border-accent-text/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-text/5 via-transparent to-accent-text/5"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center px-4 py-2 bg-accent-text/10 rounded-full mb-6">
                  <Building className="h-5 w-5 text-accent-text mr-2" />
                  <span className="text-sm font-medium text-accent-text">CORPORATE SOLUTIONS</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-gelica font-bold style={{ color: '#2F4F3E' }} mb-6">
                  Transform Your Workplace Wellness
                </h2>
                <p className="text-xl style={{ color: '#5A6B5A' }} mb-8 leading-relaxed">
                  Enhance employee wellbeing and productivity with our comprehensive corporate wellness programs. From on-site sessions to virtual workshops, we bring holistic health to your workplace.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                      <CheckCircle className="h-6 w-6 text-accent-text" />
                    </div>
                    <div>
                      <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Custom Programs</h3>
                      <p className="text-sm style={{ color: '#5A6B5A' }}">Tailored to your company's needs</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                      <Users className="h-6 w-6 text-accent-text" />
                    </div>
                    <div>
                      <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Expert Facilitators</h3>
                      <p className="text-sm style={{ color: '#5A6B5A' }}">Certified wellness professionals</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                      <Zap className="h-6 w-6 text-accent-text" />
                    </div>
                    <div>
                      <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Proven Results</h3>
                      <p className="text-sm style={{ color: '#5A6B5A' }}">Increased productivity & satisfaction</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                      <Globe className="h-6 w-6 text-accent-text" />
                    </div>
                    <div>
                      <h3 className="font-medium style={{ color: '#2F4F3E' }} mb-1">Flexible Delivery</h3>
                      <p className="text-sm style={{ color: '#5A6B5A' }}">On-site or virtual options</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/corporate-wellness"
                  className="inline-flex items-center px-8 py-4 text-white bg-accent-text rounded-xl shadow-md hover:shadow-lg hover:bg-accent-text/90 transition-all"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
              
              <div className="order-1 lg:order-2 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-text/20 to-transparent rounded-xl transform rotate-3"></div>
                <img 
                  src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/listing-images/123c446f-e80c-409d-a3d3-e6fdc14949d4/corporate-wellness-yoga.webp" 
                  alt="Corporate wellness session" 
                  className="rounded-xl relative z-10  transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-[#F3F7EE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-gelica font-bold style={{ color: '#2F4F3E' }} mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl style={{ color: '#5A6B5A' }}">
              Everything you need to know about our wellness platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => {
              const Icon = faq.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-accent-text/5"
                >
                  <div className="flex items-start mb-4">
                    <div className="flex-shrink-0 p-2 bg-accent-text/10 rounded-lg mr-4">
                      <Icon className="h-6 w-6 text-accent-text" />
                    </div>
                    <h3 className="text-lg font-bold style={{ color: '#2F4F3E' }}">
                      {faq.question}
                    </h3>
                  </div>
                    <p className="leading-relaxed ml-14" style={{ color: '#5A6B5A' }}>
                    {faq.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#F3F7EE] to-transparent"></div>
        <div className="absolute -right-32 top-1/4 w-64 h-64 rounded-full bg-accent-text/5"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-gelica font-bold style={{ color: '#2F4F3E' }} mb-6">
            Ready to Begin Your Wellness Journey?
          </h2>
          <p className="text-xl style={{ color: '#5A6B5A' }} mb-12 max-w-2xl mx-auto">
            Join other wellness enthusiasts who are already transforming their lives through our global community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={handleGetStarted}
              className="inline-flex items-center px-8 py-4 text-white bg-accent-text rounded-xl shadow-md hover:shadow-lg hover:bg-accent-text/90 transition-all text-lg font-medium"
            >
              Join Our Community
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <Link 
              to="/live-stream"
              className="inline-flex items-center px-8 py-4 border-2 border-accent-text text-accent-text hover:bg-accent-text hover:text-white rounded-xl transition-colors text-lg font-medium"
            >
              Watch Live Sessions
            </Link>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold style={{ color: '#2F4F3E' }}">Join Mindful Family</h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="style={{ color: '#2F4F3E' }}/60 hover:style={{ color: '#2F4F3E' }}"
                >
                  ×
                </button>
              </div>
              <Auth />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}