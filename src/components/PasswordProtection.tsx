import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

interface PasswordProtectionProps {
  children: React.ReactNode;
}

export function PasswordProtection({ children }: PasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const hasAccess = localStorage.getItem('site-access');
    if (hasAccess === 'granted') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'jelly') {
      setIsAuthenticated(true);
      localStorage.setItem('site-access', 'granted');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7EE] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-accent-base/10 rounded-full">
              <Lock className="h-8 w-8 text-accent-text" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-content mb-2">
            Protected Access
          </h1>
          <p className="text-content/60 text-center mb-8">
            Please enter the password to access this website
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="Enter password"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-accent-text text-white py-3 rounded-lg font-medium hover:bg-accent-text/90 transition-colors"
            >
              Access Site
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}