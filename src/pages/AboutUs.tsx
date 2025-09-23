import React from 'react';
import { Meta } from '../components/Meta';
import { Heart, Users, Leaf, Globe, Shield, Sparkles } from 'lucide-react';

export function AboutUs() {
  return (
    <div>
      <Meta 
        title="About Us | Mindful Family"
        description="Learn about the founders and mission of Mindful Family - your one-stop destination for holistic wellness and mindful living."
      />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-[#F3F7EE] to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-gelica leading-tight mb-6">
                Welcome to Mindful Family
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                A dream brought to life through love, intention, and a shared passion for holistic wellness.
              </p>
            </div>
            <div className="mt-12 lg:mt-0">
              <img 
                src="https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/post-images/59bed50f-5ccf-4265-87fa-7743af34d361/OwnersMindfulFamily.png"
                alt="Mary and Rik - Founders of Mindful Family"
                className="rounded-xl shadow-xl w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-2xl text-content/80 mb-8">Hello lovely people! We are so happy you're here 😊</p>
          
          <div className="space-y-6 text-lg text-content/80">
            <p>
              We're Mary and Rik, the Founders of Mindful Family—a dream brought to life through love, intention, and a shared passion for holistic wellness. What started as a spark of inspiration quickly became a vibrant, soul-led platform designed to support and uplift individuals and families on their journey toward well-being.
            </p>
            
            <p>
              Our journey began with a simple idea—to bring together various aspects of natural and holistic living into one cohesive platform. We wanted to create something different. Something complete. Something that felt like home for the wellness world.
            </p>

            <p>
              Whether you're looking for a Naturopathic Practitioner Directory, a Job Board for mindful work, a Learning Hub with courses and workshops, or a place to share plant-based recipes, tune into livestreams, join or promote your retreats and events, explore seasonal living and foraging tools, or simply connect with like-hearted people through our conscious social media and news feed—you've found it. This is your place.
            </p>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="py-24 bg-[#F3F7EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-3xl font-gelica font-bold text-content mb-6">Mission Statement</h2>
              <p className="text-lg text-content/80">
                Our mission is to be the heart and home of holistic wellness—bringing everything together in one conscious, accessible space. We're here to empower, educate and inspire individuals and families to live more mindfully, connect more deeply, and thrive in harmony with body, mind and soul.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-3xl font-gelica font-bold text-content mb-6">Vision Statement</h2>
              <p className="text-lg text-content/80">
                Our vision is to create and nurture a world where holistic well-being is a fundamental part of everybody's everyday life. A world where everything you need is in one place—supporting a global community to grow, heal, and flourish, together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-gelica font-bold text-content text-center mb-16">Our Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Heart className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Holistic Well-being</h3>
              </div>
              <p className="text-content/80">
                We believe in nurturing the body, mind, and soul through a balanced and comprehensive approach to wellness.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Community</h3>
              </div>
              <p className="text-content/80">
                We are dedicated to building a supportive, inclusive, and vibrant community where everyone can share, learn, and grow together.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Leaf className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Mindfulness</h3>
              </div>
              <p className="text-content/80">
                We encourage mindful living, promoting awareness, compassion, and presence in every aspect of life.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Sustainability</h3>
              </div>
              <p className="text-content/80">
                We are committed to sustainable practices and promoting natural, eco-friendly solutions for a healthier planet.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Empowerment</h3>
              </div>
              <p className="text-content/80">
                We strive to empower individuals with the knowledge, tools, and resources they need to take charge of their well-being.
              </p>
            </div>

            <div className="bg-[#F3F7EE] rounded-xl p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Sparkles className="h-6 w-6 text-accent-text" />
                <h3 className="text-xl font-semibold text-content">Innovation</h3>
              </div>
              <p className="text-content/80">
                We continuously seek to innovate and expand our offerings to meet the evolving needs of our community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Closing CTA */}
      <div className="py-24 bg-gradient-to-b from-[#F3F7EE] to-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-gelica font-bold text-content mb-6">
            Join Our Mindful Community
          </h2>
          <p className="text-xl text-content/80 mb-8">
            Step into a space where wellness meets community, and everything you need is under one roof. This is your sanctuary, your resource, your inspiration—Welcome to Mindful Family.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('show-auth'))}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-accent-text hover:bg-accent-text/90 transition-colors"
          >
            Create Your Account
          </button>
        </div>
      </div>
    </div>
  );
}