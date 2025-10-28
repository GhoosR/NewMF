import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, MessageSquare, Check, X, AlertCircle, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPractitionerBookings, updateBookingStatus, getBookingMessages, sendBookingMessage } from '../../lib/bookings';
import { supabase } from '../../lib/supabase';
import type { Booking, BookingMessage } from '../../types/bookings';

interface BookingOverviewProps {
  practitionerId: string;
}

export function BookingOverview({ practitionerId }: BookingOverviewProps) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [bookingAvailable, setBookingAvailable] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchBookingAvailability();
  }, [practitionerId]);

  useEffect(() => {
    if (selectedBooking) {
      fetchMessages(selectedBooking.id);
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getPractitionerBookings(practitionerId);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('practitioners')
        .select('booking_available')
        .eq('id', practitionerId)
        .single();

      if (error) throw error;
      setBookingAvailable(data?.booking_available ?? true);
    } catch (err: any) {
      console.error('Error fetching booking availability:', err);
    }
  };

  const handleToggleBookingAvailability = async () => {
    setUpdatingAvailability(true);
    try {
      const newAvailability = !bookingAvailable;
      
      const { error } = await supabase
        .from('practitioners')
        .update({ booking_available: newAvailability })
        .eq('id', practitionerId);

      if (error) throw error;
      
      setBookingAvailable(newAvailability);
    } catch (err: any) {
      setError(err.message || 'Failed to update booking availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const fetchMessages = async (bookingId: string) => {
    try {
      const data = await getBookingMessages(bookingId);
      setMessages(data);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    setLoading(true);
    try {
      await updateBookingStatus(bookingId, status);
      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDM = () => {
    if (!selectedBooking) return;
    const otherUserId = selectedBooking.client?.id || selectedBooking.client_id;
    if (otherUserId) {
      navigate(`/chat/${otherUserId}`);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading && bookings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F59E0B' }}></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Booking Overview</h2>
          
          {/* Booking Availability Toggle */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">
              {bookingAvailable ? 'Bookings Enabled' : 'Bookings Disabled'}
            </span>
            <button
              onClick={handleToggleBookingAvailability}
              disabled={updatingAvailability}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                bookingAvailable 
                  ? 'bg-green-600 focus:ring-green-500' 
                  : 'bg-gray-200 focus:ring-gray-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  bookingAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            {updatingAvailability && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#F59E0B' }}></div>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All Bookings' },
            { key: 'pending', label: 'Pending' },
            { key: 'accepted', label: 'Accepted' },
            { key: 'declined', label: 'Declined' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === tab.key
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={filter === tab.key ? { backgroundColor: '#7A9A3A' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Bookings List */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bookings ({filteredBookings.length})
          </h3>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBooking?.id === booking.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {booking.client?.full_name || booking.client?.username}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.booking_date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </span>
                    </div>
                    
                    {booking.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    
                    {booking.status === 'pending' && (
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(booking.id, 'accepted');
                          }}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(booking.id, 'declined');
                          }}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No bookings found</p>
            </div>
          )}
        </div>

        {/* Booking Details and Messages */}
        <div>
          {selectedBooking ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Booking Details
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Client:</span>
                    <p className="text-gray-900">
                      {selectedBooking.client?.full_name || selectedBooking.client?.username}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Date & Time:</span>
                    <p className="text-gray-900">
                      {formatDate(selectedBooking.booking_date)} at {formatTime(selectedBooking.start_time)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                    <p className="text-gray-900">{selectedBooking.duration_minutes} minutes</p>
                  </div>
                  
                  {selectedBooking.notes && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Notes:</span>
                      <p className="text-gray-900">{selectedBooking.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                  </h4>
                </div>
                
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.sender_id === selectedBooking.practitioner_id
                            ? 'bg-green-50 ml-8'
                            : 'bg-gray-50 mr-8'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender?.full_name || message.sender?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 border-t">
                  <div className="flex justify-end">
                    <button
                      onClick={handleOpenDM}
                      className="inline-flex items-center px-4 py-2 rounded-md text-white"
                      style={{ backgroundColor: '#7A9A3A' }}
                    >
                      <Mail className="w-4 h-4 mr-2" /> Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a booking to view details and messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
