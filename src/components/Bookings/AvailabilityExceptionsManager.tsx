import React, { useState, useEffect } from 'react';
import { Calendar, X, Plus, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PractitionerAvailabilityException, AvailabilityExceptionData } from '../../types/bookings';

interface AvailabilityExceptionsManagerProps {
  practitionerId: string;
  onExceptionsUpdated?: () => void;
}

export function AvailabilityExceptionsManager({ practitionerId, onExceptionsUpdated }: AvailabilityExceptionsManagerProps) {
  const [exceptions, setExceptions] = useState<PractitionerAvailabilityException[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newException, setNewException] = useState<AvailabilityExceptionData>({
    date: '',
    is_available: false,
    custom_start_time: '',
    custom_end_time: '',
    custom_slot_duration_minutes: 60,
    notes: ''
  });

  useEffect(() => {
    fetchExceptions();
  }, [practitionerId]);

  const fetchExceptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('practitioner_availability_exceptions')
        .select('*')
        .eq('practitioner_id', practitionerId)
        .order('date', { ascending: false });

      if (error) throw error;
      setExceptions(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load availability exceptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddException = async () => {
    if (!newException.date) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('practitioner_availability_exceptions')
        .upsert([{
          practitioner_id: practitionerId,
          date: newException.date,
          is_available: newException.is_available,
          custom_start_time: newException.custom_start_time || null,
          custom_end_time: newException.custom_end_time || null,
          custom_slot_duration_minutes: newException.custom_slot_duration_minutes || null,
          notes: newException.notes || null,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'practitioner_id,date'
        });

      if (error) throw error;
      
      setShowAddForm(false);
      setNewException({
        date: '',
        is_available: false,
        custom_start_time: '',
        custom_end_time: '',
        custom_slot_duration_minutes: 60,
        notes: ''
      });
      await fetchExceptions();
      onExceptionsUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add availability exception');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteException = async (exceptionId: string) => {
    if (!window.confirm('Are you sure you want to delete this exception?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('practitioner_availability_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) throw error;
      
      await fetchExceptions();
      onExceptionsUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exception');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading && exceptions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F59E0B' }}></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Availability Exceptions</h2>
          <p className="text-sm text-gray-600">Override your default working hours for specific dates</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md"
          style={{ backgroundColor: '#F59E0B' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59E0B'}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Exception
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Exception</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={newException.date}
                onChange={(e) => setNewException(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="availability"
                  checked={!newException.is_available}
                  onChange={() => setNewException(prev => ({ ...prev, is_available: false }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Unavailable (completely blocked)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="availability"
                  checked={newException.is_available}
                  onChange={() => setNewException(prev => ({ ...prev, is_available: true }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Custom hours</span>
              </label>
            </div>
            
            {newException.is_available && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Start Time
                  </label>
                  <input
                    type="time"
                    value={newException.custom_start_time}
                    onChange={(e) => setNewException(prev => ({ ...prev, custom_start_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom End Time
                  </label>
                  <input
                    type="time"
                    value={newException.custom_end_time}
                    onChange={(e) => setNewException(prev => ({ ...prev, custom_end_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={newException.notes}
                onChange={(e) => setNewException(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="e.g., Holiday, Personal appointment, etc."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddException}
              disabled={loading || !newException.date}
              className="px-4 py-2 text-white rounded-md disabled:opacity-50"
              style={{ backgroundColor: '#F59E0B' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59E0B'}
            >
              {loading ? 'Adding...' : 'Add Exception'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {exceptions.map(exception => (
          <div key={exception.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {formatDate(exception.date)}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {!exception.is_available ? (
                      <span className="flex items-center text-red-600">
                        <X className="w-4 h-4 mr-1" />
                        Unavailable
                      </span>
                    ) : (
                      <span className="flex items-center text-green-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Custom hours: {exception.custom_start_time && formatTime(exception.custom_start_time)} - {exception.custom_end_time && formatTime(exception.custom_end_time)}
                      </span>
                    )}
                    {exception.notes && (
                      <span className="text-gray-500">• {exception.notes}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDeleteException(exception.id)}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {exceptions.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No availability exceptions set</p>
          <p className="text-sm">Add exceptions to override your default working hours for specific dates</p>
        </div>
      )}
    </div>
  );
}
