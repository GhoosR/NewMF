import React from 'react';
import { Building2, Users, Presentation, Brain, Mail, ArrowRight } from 'lucide-react';
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

      {/* Features Grid */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Premium Membership */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8">
              <Users className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Premium Wellness Membership for All Employees
              </h3>
              <p className="text-content/70 mb-6">
                Empower your team with our comprehensive corporate wellness program. Each employee receives a premium membership, granting full access to:
              </p>
              <ul className="space-y-3 text-content/70">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Exclusive wellness events
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Health and fitness courses
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-accent-text rounded-full mr-2"></span>
                  Our thriving wellness community
                </li>
              </ul>
            </div>

            {/* Corporate Wellness Days */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8">
              <Building2 className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Customised Corporate Wellness Days
              </h3>
              <p className="text-content/70">
                Let us orchestrate your workplace wellness initiatives! Our experienced practitioners design and deliver the perfect wellness day, tailored to your unique business needs and company culture. Contact us to craft your bespoke day of wellness and team building!
              </p>
            </div>

            {/* Expert Speakers */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8">
              <Presentation className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Expert Health Speakers
              </h3>
              <p className="text-content/70">
                Elevate your organisational wellness with our roster of expert speakers. We organize engaging presentations on various health and wellness topics to inform and inspire your employees, fostering a culture of holistic employee wellness.
              </p>
            </div>

            {/* Mental Health Workshops */}
            <div className="bg-gradient-to-br from-accent-text/5 to-accent-text/10 rounded-xl p-8">
              <Brain className="h-12 w-12 text-accent-text mb-6" />
              <h3 className="text-2xl font-bold text-content mb-4">
                Stress Management and Mental Health Workshops
              </h3>
              <p className="text-content/70">
                Our interactive workshops equip your staff with effective techniques to manage work-related stress and maintain a healthy work-life balance. Employees will gain practical strategies to enhance their mental health and overall wellbeing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-accent-text text-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-gelica font-bold mb-6">
            Invest in Your Team's Wellbeing Today!
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Discover the ROI of corporate wellness – Get in touch to start your journey towards a healthier, happier workplace!
          </p>
          <a 
            href="mailto:support@mindful.family"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white hover:bg-white hover:text-accent-text transition-colors"
          >
            <Mail className="mr-2 h-5 w-5" />
            Get in Contact
          </a>
        </div>
      </div>
    </div>
  );
}