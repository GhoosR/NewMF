import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, User, X } from 'lucide-react';
import { createBooking, getPractitionerAvailability } from '../../lib/bookings';
import { supabase } from '../../lib/supabase';
import type { CreateBookingData, PractitionerAvailability } from '../../types/bookings';

interface BookingFormProps {
  practitionerId: string;
  practitionerName: string;
  onBookingCreated?: (booking: any) => void;
  onClose?: () => void;
}

export function BookingForm({ practitionerId, practitionerName, onBookingCreated, onClose }: BookingFormProps) {
  const [formData, setFormData] = useState<CreateBookingData>({
    practitioner_id: practitionerId,
    booking_date: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    notes: ''
  });
  
  const [availability, setAvailability] = useState<PractitionerAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Fetch availability when date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate, practitionerId]);

  const fetchAvailability = async (date: string) => {
    try {
      // Use the generate_availability_slots function from the database
      const { data, error } = await supabase
        .rpc('generate_availability_slots', {
          p_practitioner_id: practitionerId,
          p_date: date
        });

      if (error) {
        console.error('Database function error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        setAvailability([]);
        setError('No availability for this date. Please check if the practitioner has set their working hours.');
        return;
      }

      // Convert the result to the expected format and filter out fully booked slots
      const availabilityData = data
        .filter((slot: any) => slot.is_available)
        .map((slot: any) => ({
          id: `generated-${slot.start_time}-${slot.end_time}`,
          practitioner_id: practitionerId,
          date: date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
          max_bookings: slot.max_bookings,
          current_bookings: slot.current_bookings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      
      setAvailability(availabilityData);
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability');
    }
  };


  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setFormData(prev => ({ ...prev, booking_date: date }));
  };

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    setFormData(prev => ({
      ...prev,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: calculateDuration(startTime, endTime)
    }));
  };

  const calculateDuration = (start: string, end: string): number => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  };

  const getAvailableSlots = (date: string) => {
    return availability.filter(slot => 
      slot.date === date && 
      slot.is_available && 
      slot.current_bookings < slot.max_bookings
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const booking = await createBooking(formData);
      onBookingCreated?.(booking);
      onClose?.();
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full h-full sm:w-auto sm:h-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-lg shadow-xl overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Book with {practitionerName}
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-2" />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8DA847] transition-all duration-200"
            required
          />
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock className="inline w-4 h-4 mr-2" />
              Available Time Slots for {formatDate(selectedDate)}
            </label>
            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: '#7A9A3A' }}></div>
                <p className="text-sm text-gray-500 mt-3">Loading available times...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {getAvailableSlots(selectedDate).map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSlotSelect(slot.start_time, slot.end_time)}
                    className={`p-4 text-sm border rounded-lg transition-all duration-200 transform hover:scale-105 ${
                      formData.start_time === slot.start_time
                        ? 'bg-[#8DA847] text-white border-[#8DA847] shadow-md'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#8DA847] hover:bg-[#F3F7EE]'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-center">
                      <span className="font-medium">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {getAvailableSlots(selectedDate).length === 0 && !loading && (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No available time slots for this date.</p>
                <p className="text-gray-400 text-xs mt-1">Try selecting a different date.</p>
              </div>
            )}
          </div>
        )}

        {/* Duration */}
        {formData.start_time && formData.end_time && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {formData.duration_minutes} minutes
            </div>
          </div>
        )}


        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="inline w-4 h-4 mr-2" />
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full px-3 py-3 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8DA847] transition-all duration-200 resize-none"
            placeholder="Any specific requirements or questions..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !formData.booking_date || !formData.start_time}
            className="px-6 py-3 bg-[#8DA847] text-white rounded-lg hover:bg-[#7A9A3A] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Booking...
              </div>
            ) : (
              'Request Booking'
            )}
          </button>
        </div>
          </form>
        </div>
      </div>
    </div>
  );
}
