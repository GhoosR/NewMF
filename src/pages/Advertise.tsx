import React from 'react';
import { Megaphone, TrendingUp, Users, Calendar, Mail, Target, Clock, DollarSign, BarChart } from 'lucide-react';
import { Meta } from '../components/Meta';

export function Advertise() {
  return (
    <div className="min-h-screen">
      <Meta 
        title="Advertise Your Wellness Services | Mindful Family"
        description="Promote your wellness services, events, and practitioner listings to our engaged community. Reach more clients and grow your business with Mindful Family."
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#F3F7EE] to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-gelica leading-tight mb-6">
                Amplify Your Wellness Business
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Reach thousands of wellness enthusiasts and grow your business through our targeted advertising solutions.
              </p>
              <a 
                href="mailto:support@mindful.family"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#8DA847] hover:bg-[#7A9339] transition-colors"
              >
                <Mail className="h-5 w-5 mr-2" />
                Contact Our Team
              </a>
            </div>
            <div className="mt-12 lg:mt-0">
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=2000"
                alt="Business Growth"
                className="rounded-xl shadow-xl w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-gelica font-bold text-content mb-4">
              Why Advertise with Us?
            </h2>
            <p className="text-lg text-content/70 max-w-2xl mx-auto">
              Get your wellness services in front of our engaged community of health-conscious individuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F3F7EE] rounded-xl p-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#8DA847] rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Targeted Reach</h3>
              <p className="text-content/70">
                Connect with an engaged audience actively seeking wellness services and experiences.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#8DA847] rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Increased Visibility</h3>
              <p className="text-content/70">
                Featured placement in search results and dedicated promotional spots across our platform.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#8DA847] rounded-lg flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-content mb-2">Performance Tracking</h3>
              <p className="text-content/70">
                Get detailed insights into your campaign's performance and engagement metrics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Advertising Options */}
      <div className="py-24 bg-[#F3F7EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-gelica font-bold text-content mb-4">
              Advertising Options
            </h2>
            <p className="text-lg text-content/70 max-w-2xl mx-auto">
              Choose from our range of advertising solutions designed to maximize your exposure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-[#8DA847] mr-3" />
                <h3 className="text-lg font-semibold text-content">Practitioner Spotlight</h3>
              </div>
              <p className="text-content/70 mb-4">
                Featured placement in practitioner search results and homepage features.
              </p>
              <div className="flex items-center text-sm text-content/60">
                <Clock className="h-4 w-4 mr-2" />
                <span>1-3 months duration</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <Calendar className="h-6 w-6 text-[#8DA847] mr-3" />
                <h3 className="text-lg font-semibold text-content">Event Promotion</h3>
              </div>
              <p className="text-content/70 mb-4">
                Premium visibility for your events with featured listings and email promotions.
              </p>
              <div className="flex items-center text-sm text-content/60">
                <Clock className="h-4 w-4 mr-2" />
                <span>Event duration based</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <Megaphone className="h-6 w-6 text-[#8DA847] mr-3" />
                <h3 className="text-lg font-semibold text-content">News Feed Ads</h3>
              </div>
              <p className="text-content/70 mb-4">
                Native advertising in our community news feed for maximum engagement.
              </p>
              <div className="flex items-center text-sm text-content/60">
                <Clock className="h-4 w-4 mr-2" />
                <span>Weekly or monthly</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <DollarSign className="h-6 w-6 text-[#8DA847] mr-3" />
                <h3 className="text-lg font-semibold text-content">Custom Packages</h3>
              </div>
              <p className="text-content/70 mb-4">
                Tailored advertising solutions designed to meet your specific needs.
              </p>
              <div className="flex items-center text-sm text-content/60">
                <Clock className="h-4 w-4 mr-2" />
                <span>Flexible duration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-gelica font-bold text-content mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-content/70 mb-8">
            Contact us today to discuss how we can help promote your wellness services to our engaged community.
          </p>
          <a 
            href="mailto:support@mindful.family"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-[#8DA847] hover:bg-[#7A9339] transition-colors"
          >
            <Mail className="h-5 w-5 mr-2" />
            Get in Touch
          </a>
          <p className="mt-4 text-sm text-content/60">
            Our team will respond within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}