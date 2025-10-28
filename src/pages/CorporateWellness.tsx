import { Building2, Users, Mail, ArrowRight, Video, MessageCircle } from 'lucide-react';
import { Meta } from '../components/Meta';

export function CorporateWellness() {
  return (
    <div className="min-h-screen">
      <Meta 
        title="Corporate Wellness Programs | Mindful Family"
        description="Enhance employee wellbeing with our corporate wellness solutions. Custom programs to boost workplace health, productivity and engagement."
      />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#F3F7EE] to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-gelica font-bold text-content leading-tight mb-6">
              Wellbeing at Work: Good for Employees, Great for Business.
              </h1>
              <p className="text-xl text-content/70 mb-8">
              Wellness at work fuels happier employees, stronger teams, and lasting results. When employees feel their best, they give their best - and your workplace shines.

              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a 
                  href="#contact"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
                >
                  Contact Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
                
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <img 
                src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/happy-workplace-employees.jpg"
                alt="Corporate Wellness"
                className="rounded-xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Why We're Different Section */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-gelica font-bold text-content mb-6">
              Why We're Different: Live Connection & Community
            </h2>
            <p className="text-xl text-content/70 max-w-3xl mx-auto">
              While other wellness platforms offer isolated, pre-recorded content, we create <strong>real-time connections</strong> and <strong>vibrant communities</strong> that transform wellness from a solo journey into a shared experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Live Streaming Advantage */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-red-100 p-3 rounded-xl mr-4">
                  <Video className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-content">Live Streaming Wellness</h3>
                  <p className="text-accent-text font-medium">vs. Static Pre-Recorded Content</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Real-time interaction with wellness experts</p>
                    <p className="text-sm text-content/60">Ask questions, get instant feedback, and receive personalized guidance during live sessions</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Dynamic, responsive content</p>
                    <p className="text-sm text-content/60">Sessions adapt to your team's needs and energy in real-time, not one-size-fits-all recordings</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Scheduled wellness moments</p>
                    <p className="text-sm text-content/60">Create shared experiences with your team through regular live sessions that build routine and accountability</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Community Advantage */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl mr-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-content">Thriving Wellness Community</h3>
                  <p className="text-accent-text font-medium">vs. Individual Self-Help Platforms</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Peer support and motivation</p>
                    <p className="text-sm text-content/60">Your employees connect with like-minded individuals, share progress, and motivate each other</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Group challenges and accountability</p>
                    <p className="text-sm text-content/60">Team-based wellness challenges create friendly competition and shared goals</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <p className="font-medium text-content">Expert-moderated discussions</p>
                    <p className="text-sm text-content/60">Wellness professionals guide conversations and provide ongoing support beyond sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Premium Membership */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <Users className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Premium Wellness Membership for All Employees
              </h3>
              <p className="text-content/70 mb-6">
                Give your entire team access to our comprehensive wellness platform. Each employee receives a premium membership with full access to our curated wellness resources, helping them build healthy habits and maintain work-life balance.
              </p>
              <ul className="space-y-3 text-content/70 mb-6">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Unlimited access to wellness courses and workshops
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Weekly multiple wellness livestreams
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Direct connection with verified wellness practitioners
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Access to our supportive wellness community
                </li>
              </ul>
              <div className="bg-white/50 rounded-lg p-4 border border-accent-text/10">
                <p className="text-sm text-content/80 font-medium">
                  Perfect for companies looking to provide comprehensive wellness benefits to all employees, regardless of location or schedule.
                </p>
              </div>
            </div>

            {/* Corporate Wellness Days */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <Building2 className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Customised Corporate Wellness Days
              </h3>
              <p className="text-content/70 mb-6">
                Create memorable, impactful wellness experiences for your team with our bespoke corporate wellness days. We design and deliver tailored programs that align with your company culture and specific wellness goals.
              </p>
              <ul className="space-y-3 text-content/70 mb-6">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  On-site or virtual wellness sessions and workshops
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Team building activities focused on health and wellbeing
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Expert-led stress management and mindfulness sessions
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-3"></span>
                  Customised wellness challenges and group activities
                </li>
              </ul>
              <div className="bg-white/50 rounded-lg p-4 border border-accent-text/10">
                <p className="text-sm text-content/80 font-medium">
                  Ideal for team retreats, wellness weeks, or special company events that bring employees together around health and wellbeing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-accent-text/3 to-accent-text/6" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-12 border border-accent-text/10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-text/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-text/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-accent-text/10 rounded-full mb-6">
                <span className="text-sm font-medium text-accent-text">READY TO GET STARTED?</span>
              </div>
              
              <h2 className="text-3xl lg:text-4xl font-gelica font-bold text-content mb-6">
                Invest in Your Team's Wellbeing Today!
              </h2>
              
              <p className="text-xl text-content/70 mb-8 max-w-2xl mx-auto leading-relaxed">
                Discover the ROI of corporate wellness – Get in touch to start your journey towards a healthier, happier workplace!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a 
                  href="mailto:support@mindful.family"
                  className="inline-flex items-center justify-center px-8 py-4 bg-accent-text text-white text-lg font-medium rounded-xl hover:bg-accent-text/90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Get in Contact
                </a>
                
                <div className="flex items-center text-content/60">
                  <span className="text-sm">or email us at</span>
                  <a href="mailto:support@mindful.family" className="ml-2 text-accent-text font-medium hover:text-accent-text/80 transition-colors">
                    support@mindful.family
                  </a>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-accent-text/10">
                <p className="text-sm text-content/60">
                  <span className="font-medium text-content">Free consultation</span> • No commitment required • Custom solutions for your team
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}