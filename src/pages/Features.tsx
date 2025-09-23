import React from 'react';
import { 
  Users, Calendar, Building2, BookOpen, 
  MessageSquare, Video, Leaf, Apple, 
  UtensilsCrossed, Heart, Globe, Sprout,
  Sparkles, Briefcase, MapPin, Newspaper,
  Zap, Star, Lock, Crown
} from 'lucide-react';
import { Meta } from '../components/Meta';

export function Features() {
  const features = [
    {
      title: "Wellness Practitioners",
      icon: Users,
      description: "Connect with verified wellness professionals including yoga teachers, nutritionists, therapists, and more. Each practitioner is carefully vetted with verified credentials.",
      details: [
        "Detailed practitioner profiles",
        "Verified credentials system",
        "Direct messaging"
      ]
    },
    {
      title: "Events & Workshops",
      icon: Calendar,
      description: "Discover and join wellness events, from yoga retreats to meditation workshops. Host your own events and manage registrations seamlessly.",
      details: [
        "Event creation and management",
        "Ticket sales integration",
        "Attendee management",
        "Event discovery",
        "Calendar integration"
      ]
    },
    {
      title: "Wellness Venues",
      icon: Building2,
      description: "Find and book perfect spaces for wellness activities, from yoga studios to retreat centres. List your venue to reach the right audience.",
      details: [
        "Detailed venue listings",
        "Direct messaging",
        "Amenities showcase",
        "Virtual tours"
      ]
    },
    {
      title: "Online Courses",
      icon: BookOpen,
      description: "Access high-quality wellness courses. Learn at your own pace with our comprehensive course platform.",
      details: [
        "Video-based learning",
        "Progress tracking",
        "Certificates",
        "Interactive content"
      ]
    },
    {
      title: "Communities",
      icon: MessageSquare,
      description: "Join like-minded individuals in our wellness communities. Create your own community and foster meaningful connections.",
      details: [
        "Public and private groups",
        "Discussion forums",
        "Media sharing",
        "Event organization",
        "Member management"
      ]
    },
    {
      title: "Live Streaming",
      icon: Video,
      description: "Attend daily live wellness sessions or host your own streams. Engage with practitioners and community members in real-time.",
      details: [
        "Live wellness sessions",
        "Interactive chat",
        "Schedule notifications",
        "Multi-platform streaming"
      ]
    },
    {
      title: "Agriculture Tools",
      icon: Leaf,
      description: "Manage your agricultural projects with our specialized tools. Track plantings, harvests, and collaborate with team members.",
      details: [
        "Field management",
        "Task tracking",
        "Team collaboration",
        "Harvest planning",
        "Weather integration"
      ]
    },
    {
      title: "Nutrition Guide",
      icon: Apple,
      description: "Access comprehensive nutrition information and guides. Understand vitamins, minerals, and their sources.",
      details: [
        "Nutrient database",
        "Dietary information",
        "Supplement guides",
        "Health benefits",
        "Food sources"
      ]
    },
    {
      title: "Recipe Sharing",
      icon: UtensilsCrossed,
      description: "Share and discover healthy recipes. Create your own recipe collection and inspire others.",
      details: [
        "Recipe creation",
        "Nutritional information",
        "Dietary filters",
        "Cooking instructions",
        "Image sharing"
      ]
    },
    {
      title: "Wellness Jobs",
      icon: Briefcase,
      description: "Find or post jobs in the wellness industry. Connect employers with qualified wellness professionals.",
      details: [
        "Job listings",
        "Application management",
        "Company profiles",
        "Job alerts",
        "Industry categories"
      ]
    },
    {
      title: "Plant Identifier",
      icon: Sprout,
      description: "Identify plants using AI technology. Learn about their properties, uses, and potential benefits.",
      details: [
        "AI-powered identification",
        "Plant database"
      ]
    }
  ];

  const premiumFeatures = [
    {
      icon: Crown,
      title: "Professional Features",
      description: "Unlock advanced features with our Professional membership:",
      benefits: [
        "Create and manage listings",
        "Host events and sell tickets",
        "Access advanced analytics",
        "Priority support"
      ]
    },
    {
      icon: Lock,
      title: "Security & Privacy",
      description: "Your data and transactions are protected with:",
      benefits: [
        "Secure payment processing",
        "Data encryption",
        "GDPR compliance",
        "Regular security audits",
        "Privacy controls"
      ]
    },
    {
      icon: Star,
      title: "Support & Community",
      description: "Get help when you need it:",
      benefits: [
        "24/7 customer support",
        "Community guidelines",
        "Help documentation",
        "Feature requests",
        "Regular updates"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7EE] to-white">
      <Meta 
        title="Platform Features | Mindful Family"
        description="Explore the comprehensive features of Mindful Family's wellness platform. From practitioner listings to community tools, discover everything we offer."
      />

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-gelica text-content leading-tight mb-6">
            Everything You Need for Your Wellness Journey
          </h1>
          <p className="text-xl text-content/70 max-w-3xl mx-auto">
            Discover our comprehensive suite of features designed to support your wellness practice, 
            connect with like-minded individuals, and grow your wellness business.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-accent-base/10 rounded-lg">
                    <Icon className="h-6 w-6 text-accent-text" />
                  </div>
                  <h3 className="text-xl font-semibold text-content ml-4">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-content/70 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-center text-content/70">
                      <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-gelica font-bold text-content mb-4">
              Professional Membership Benefits
            </h2>
            <p className="text-lg text-content/70">
              Take your wellness journey to the next level with our professional features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {premiumFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="bg-accent-base/5 rounded-xl p-8"
                >
                  <div className="flex items-center mb-6">
                    <Icon className="h-8 w-8 text-accent-text" />
                    <h3 className="text-xl font-semibold text-content ml-4">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-content/70 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center text-content/70">
                        <Zap className="h-4 w-4 text-accent-text mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-b from-white to-[#F3F7EE]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-gelica font-bold text-content mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-content/70 mb-8">
            Join our community today and discover all the features Mindful Family has to offer.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Create Your Account
          </button>
        </div>
      </div>
    </div>
  );
}