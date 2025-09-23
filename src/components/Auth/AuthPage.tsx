import React from 'react';
import { Leaf, Mail, User, Globe } from 'lucide-react';
import { AuthForm } from './AuthForm';

interface AuthPageProps {
  onClose?: () => void;
}

export function AuthPage({ onClose }: AuthPageProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-accent-text" />
            <span className="text-2xl font-gelica font-bold">Mindful Family</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center">
          <h1 className="text-5xl font-gelica font-bold mb-4">Get started</h1>
          <p className="text-content/60 mb-8">
            Already have an account?{' '}
            <button onClick={onClose} className="text-accent-text hover:text-accent-text/80">
              Sign in
            </button>
          </p>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-content mb-1.5">Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="Enter your name"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-1.5">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="Enter your email"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-1.5">Country</label>
              <div className="relative">
                <select className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 appearance-none">
                  <option value="">Select your country</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                  <option value="ca">Canada</option>
                </select>
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="h-5 w-5 text-content/40" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            <button className="w-full bg-accent-text text-white py-3 rounded-lg font-medium hover:bg-accent-text/90 transition-colors">
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:block w-1/2 bg-[#6366F1] p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-1 h-1 bg-white rounded-full top-[10%] left-[15%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[20%] left-[45%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[15%] left-[75%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[45%] left-[25%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[55%] left-[65%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[75%] left-[35%] animate-pulse"></div>
          <div className="absolute w-1 h-1 bg-white rounded-full top-[85%] left-[85%] animate-pulse"></div>
        </div>

        <div className="relative h-full flex flex-col justify-center items-center text-white">
          <div className="mb-8">
            <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 rounded-full bg-white/10 animate-spin-slow"></div>
              <div className="absolute inset-2 rounded-full bg-white/20"></div>
              <div className="absolute inset-4 rounded-full bg-white/30 flex items-center justify-center">
                <Leaf className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-gelica font-bold text-center mb-4">
            Have your own personal wellness space
          </h2>
          <p className="text-white/80 text-center max-w-md">
            Join our community of wellness practitioners and enthusiasts. Share your journey and connect with others.
          </p>
        </div>
      </div>
    </div>
  </div>