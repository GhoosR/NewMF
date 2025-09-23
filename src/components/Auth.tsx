import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Mail, User, Lock } from 'lucide-react';
import { Logo } from './Logo';
import { checkUsernameAvailability, signUp, signIn } from '../lib/auth/authService';
import { supabase } from '../lib/supabase';

interface AuthProps {
  onClose?: () => void;
}

type Step = 'signin' | 'signup' | 'forgot';

export function Auth({ onClose }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<Step>('signin');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return false;
    }

    if (mode !== 'forgot' && !password.trim()) {
      setError('Please enter your password');
      return false;
    }

    if (mode === 'signup' && !username.trim()) {
      setError('Please choose a username');
      return false;
    }

    if (mode !== 'forgot' && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (mode === 'signup') {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores');
        return false;
      }
    }

    if (mode === 'signup' && !acceptedTerms) {
      setError('Please accept the Terms of Service to continue');
      return false;
    }

    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    
    try {
      if (mode === 'signup') {
        const isAvailable = await checkUsernameAvailability(username);
        if (!isAvailable) {
          throw new Error('This username is already taken. Please choose another one.');
        }

        await signUp(email, password, username);
        onClose?.();
      } else if (mode === 'signin') {
        await signIn(email, password);
        onClose?.();
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="w-full h-full md:h-auto md:max-w-5xl bg-white md:rounded-lg overflow-hidden flex flex-col md:flex-row shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/10 z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center space-x-2">
              <Logo className="h-16 w-16 text-accent-text" />
              <span className="text-2xl font-gelica font-bold">Mindful Family</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center py-4 md:py-0">
            <h1 className="text-4xl md:text-5xl font-gelica font-bold mb-4">
              {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Get started' : 'Reset Password'}
            </h1>
            <p className="text-content/60 mb-8">
              {mode === 'forgot' ? (
                "Enter your email address and we'll send you a link to reset your password."
              ) : (
                <>
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button 
                    onClick={() => {
                      setMode(mode === 'signin' ? 'signup' : 'signin');
                      setError('');
                    }}
                    className="text-accent-text hover:text-accent-text/80"
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </>
              )}
            </p>

            <form onSubmit={handleAuth} className="space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      placeholder="Choose a username"
                    />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                  </div>
                </div>
              )}

              {mode === 'forgot' ? (
                <div>
                  <label className="block text-sm font-medium text-content mb-1.5">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        setError('');
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      placeholder="Enter your email"
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-content mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                        placeholder="Enter your email"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-content mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError('');
                        }}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                        placeholder="Enter your password"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                    </div>
                  </div>
                </>
              )}

              {mode === 'signup' && (
                <div className="flex items-start space-x-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-accent-text/20 text-accent-text focus:ring-accent-text"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="text-content/80">
                      I accept the{' '}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="text-accent-text hover:text-accent-text/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Terms of Service
                      </Link>
                      {' '}and{' '}
                      <Link
                        to="/privacy-policy"
                        target="_blank"
                        className="text-accent-text hover:text-accent-text/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              )}

              {resetSent && mode === 'forgot' && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm">
                  Password reset instructions have been sent to your email. Please check your inbox and spam folder.
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-text text-white py-3 rounded-lg font-medium hover:bg-accent-text/90 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Reset Password'}
                </button>

                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError('');
                      setResetSent(false);
                    }}
                    className="w-full text-center text-accent-text hover:text-accent-text/80"
                  >
                    Back to Sign In
                  </button>
                ) : mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="w-full text-center text-accent-text hover:text-accent-text/80"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Nature Background */}
        <div 
          className="hidden md:block md:w-1/2 relative overflow-hidden"
          style={{
            backgroundImage: 'url("https://afvltpqnhmaxanirwnqz.supabase.co/storage/v1/object/public/blog-images/59bed50f-5ccf-4265-87fa-7743af34d361/Mindful%20Family%20Wellness%20Hub%20Signup%20-%20Lady%20walking%20in%20grass%20barefeet.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative h-full flex flex-col justify-center items-center text-white p-12">
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-white/10 animate-spin-slow"></div>
                <div className="absolute inset-2 rounded-full bg-white/20"></div>
                <div className="absolute inset-4 rounded-full bg-white/30 flex items-center justify-center">
                  <Logo className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-4xl font-gelica font-bold text-center mb-4">
              Have your own personal wellness space
            </h2>
            <p className="text-white/90 text-center max-w-md">
              Join our community of wellness practitioners and enthusiasts. Share your journey and connect with others.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth