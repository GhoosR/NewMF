import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, User, MessageSquare, Settings } from 'lucide-react';
import { BookingOverview } from '../components/Bookings/BookingOverview';
import { AvailabilityCalendar } from '../components/Bookings/AvailabilityCalendar';
import { WorkingHoursManager } from '../components/Bookings/WorkingHoursManager';
import { AvailabilityExceptionsManager } from '../components/Bookings/AvailabilityExceptionsManager';
import { Meta } from '../components/Meta';

export function BookingOverviewPage() {
  const { practitionerId } = useParams<{ practitionerId: string }>();
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability' | 'working-hours' | 'exceptions'>('bookings');

  if (!practitionerId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Practitioner not found</h2>
          <p className="text-gray-600">The practitioner ID is missing from the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Meta 
        title="Booking Management"
        description="Manage your bookings and availability"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Management</h1>
            <p className="text-gray-600">Manage your bookings and set your availability</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Bookings
                </div>
              </button>
              <button
                onClick={() => setActiveTab('working-hours')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'working-hours'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Working Hours
                </div>
              </button>
              <button
                onClick={() => setActiveTab('exceptions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exceptions'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Exceptions
                </div>
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'availability'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar View
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'bookings' && (
            <BookingOverview practitionerId={practitionerId} />
          )}
          
          {activeTab === 'working-hours' && (
            <WorkingHoursManager 
              practitionerId={practitionerId}
              onWorkingHoursUpdated={() => {
                console.log('Working hours updated');
              }}
            />
          )}
          
          {activeTab === 'exceptions' && (
            <AvailabilityExceptionsManager 
              practitionerId={practitionerId}
              onExceptionsUpdated={() => {
                console.log('Availability exceptions updated');
              }}
            />
          )}
          
          {activeTab === 'availability' && (
            <AvailabilityCalendar 
              practitionerId={practitionerId}
              onAvailabilityUpdated={() => {
                // Could trigger a refresh or show a success message
                console.log('Availability updated');
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
