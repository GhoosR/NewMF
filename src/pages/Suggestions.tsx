import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { Meta } from '../components/Meta';
import { supabase } from '../lib/supabase';

export function Suggestions() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create notification for all admins
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('is_admin', true);

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'suggestion',
          title: 'New Suggestion Received',
          message: `${formData.name} sent a suggestion: ${formData.subject}`,
          data: {
            sender_name: formData.name,
            sender_email: formData.email,
            subject: formData.subject,
            message: formData.message,
            submitted_at: new Date().toISOString()
          }
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) throw notificationError;
      }

      // Show success animation
      setShowSuccess(true);
      
      // Reset form after animation
      setTimeout(() => {
        setFormData({ name: '', email: '', subject: '', message: '' });
        setShowSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error sending suggestion:', err);
      setError(err.message || 'Failed to send suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3F7EE] to-white flex items-center justify-center">
        <Meta 
          title="Suggestion Sent | Mindful Family"
          description="Thank you for your suggestion! We appreciate your feedback."
        />
        
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-xl shadow-xl p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-text/10 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent-text/5 rounded-full animate-pulse delay-300"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Sparkles className="h-16 w-16 text-accent-text/20 animate-spin-slow" />
              </div>
            </div>
            
            {/* Success content */}
            <div className="relative z-10">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h1 className="text-2xl font-gelica font-bold text-content mb-4 animate-fade-in">
                Suggestion Sent! ✨
              </h1>
              
              <p className="text-content/70 mb-6 animate-fade-in delay-100">
                Thank you for taking the time to share your thoughts with us. Your suggestion has been delivered to our team and we'll review it carefully.
              </p>
              
              <div className="animate-fade-in delay-200">
                <div className="inline-flex items-center px-4 py-2 bg-accent-base/10 text-accent-text rounded-full text-sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Letter delivered to our team
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3F7EE] to-white">
      <Meta 
        title="Send Us Your Suggestions | Mindful Family"
        description="We value your feedback! Share your suggestions to help us improve the Mindful Family platform."
      />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-text/10 rounded-full mb-6">
              <MessageSquare className="h-8 w-8 text-accent-text" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-gelica text-content leading-tight mb-6">
              We'd Love to Hear From You
            </h1>
            <p className="text-xl text-content/70 max-w-2xl mx-auto">
              Your suggestions help us create a better wellness platform for everyone. 
              Share your ideas, feedback, or feature requests with our team.
            </p>
          </div>

          {/* Letter Form */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden relative">
              {/* Letter header with decorative elements */}
              <div className="bg-gradient-to-r from-accent-text/5 to-accent-text/10 p-8 relative">
                <div className="absolute top-4 right-4 w-12 h-12 border-2 border-accent-text/20 rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-8 h-8 bg-accent-text/10 rounded-full"></div>
                <h2 className="text-2xl font-gelica font-bold text-content mb-2">
                  Dear Mindful Family Team,
                </h2>
                <p className="text-content/60">
                  I have a suggestion to share with you...
                </p>
              </div>

              {/* Form content */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-content mb-2">
                      Your Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 bg-accent-base/5"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-content mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-content/40" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 bg-accent-base/5"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-content mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 bg-accent-base/5"
                    placeholder="What's your suggestion about?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-content mb-2">
                    Your Suggestion *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 bg-accent-base/5 font-['Kalam',_cursive] text-lg leading-relaxed"
                    rows={6}
                    placeholder="Share your ideas, feedback, or suggestions here. We read every message and truly value your input..."
                    style={{
                      backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(141, 168, 71, 0.1) 31px, rgba(141, 168, 71, 0.1) 32px)',
                      backgroundAttachment: 'local',
                      lineHeight: '32px'
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Letter closing */}
                <div className="text-right text-content/60 font-['Kalam',_cursive] text-lg">
                  <p>With gratitude,</p>
                  <p className="mt-2 font-medium">{formData.name || '[Your Name]'}</p>
                </div>

                {/* Send button */}
                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`inline-flex items-center px-8 py-4 text-lg font-medium rounded-xl text-white transition-all duration-300 transform ${
                      loading 
                        ? 'bg-accent-text/70 scale-95' 
                        : 'bg-accent-text hover:bg-accent-text/90 hover:scale-105 shadow-lg hover:shadow-xl'
                    } disabled:cursor-not-allowed`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending Letter...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        Send Suggestion
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Decorative stamp */}
              <div className="absolute top-8 right-8 w-16 h-16 border-2 border-accent-text/30 rounded-full flex items-center justify-center transform rotate-12">
                <span className="text-accent-text/60 text-xs font-bold">SUGGESTION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}