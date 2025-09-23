import React, { useState, useEffect } from 'react';
import { Mail, User, Calendar, MessageSquare, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils/dateUtils';

interface Suggestion {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data: {
    sender_name: string;
    sender_email: string;
    subject: string;
    message: string;
    submitted_at: string;
  };
}

export function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const fetchSuggestions = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'suggestion')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSuggestions(data || []);
    } catch (err: any) {
      console.error('Error fetching suggestions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      setSuggestions(prev => prev.map(s => 
        s.id === id ? { ...s, read: true } : s
      ));
    } catch (err: any) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuggestions(prev => prev.filter(s => s.id !== id));
      setSelectedSuggestion(null);
    } catch (err: any) {
      console.error('Error deleting suggestion:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-text"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-content">User Suggestions</h2>
        <div className="text-sm text-content/60">
          {suggestions.filter(s => !s.read).length} unread
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suggestions List */}
        <div className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-content/60">
              No suggestions yet
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => {
                  setSelectedSuggestion(suggestion);
                  if (!suggestion.read) {
                    handleMarkAsRead(suggestion.id);
                  }
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  !suggestion.read 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-accent-text/10'
                } ${
                  selectedSuggestion?.id === suggestion.id 
                    ? 'ring-2 ring-accent-text/20' 
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-accent-text" />
                      <span className="font-medium text-content">
                        {suggestion.data.sender_name}
                      </span>
                      {!suggestion.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <h3 className="font-medium text-content mb-1">
                      {suggestion.data.subject}
                    </h3>
                    <p className="text-sm text-content/60 line-clamp-2">
                      {suggestion.data.message}
                    </p>
                    <div className="flex items-center text-xs text-content/50 mt-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(suggestion.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Suggestion Details */}
        <div className="lg:sticky lg:top-4">
          {selectedSuggestion ? (
            <div className="bg-white rounded-lg shadow-sm border border-accent-text/10 overflow-hidden">
              <div className="bg-accent-base/5 p-6 border-b border-accent-text/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-content">
                    {selectedSuggestion.data.subject}
                  </h3>
                  <button
                    onClick={() => handleDelete(selectedSuggestion.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete suggestion"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-content/80">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">{selectedSuggestion.data.sender_name}</span>
                  </div>
                  <div className="flex items-center text-content/80">
                    <Mail className="h-4 w-4 mr-2" />
                    <a 
                      href={`mailto:${selectedSuggestion.data.sender_email}`}
                      className="text-accent-text hover:text-accent-text/80"
                    >
                      {selectedSuggestion.data.sender_email}
                    </a>
                  </div>
                  <div className="flex items-center text-content/80">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(selectedSuggestion.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h4 className="text-sm font-medium text-content mb-3">Message:</h4>
                <div className="bg-accent-base/5 rounded-lg p-4 border border-accent-text/10">
                  <p className="text-content/80 whitespace-pre-line leading-relaxed font-['Kalam',_cursive]">
                    {selectedSuggestion.data.message}
                  </p>
                </div>
                
                <div className="mt-6 text-right text-content/60 font-['Kalam',_cursive]">
                  <p>Best regards,</p>
                  <p className="mt-1 font-medium">{selectedSuggestion.data.sender_name}</p>
                </div>

                {!selectedSuggestion.read && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => handleMarkAsRead(selectedSuggestion.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-accent-text/10 p-8 text-center">
              <MessageSquare className="h-12 w-12 text-content/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-content mb-2">Select a Suggestion</h3>
              <p className="text-content/60">
                Choose a suggestion from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}