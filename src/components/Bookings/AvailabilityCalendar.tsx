import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BookingCalendarDay {
  date: string;
  slots: any[];
  is_available: boolean;
}

interface AvailabilityCalendarProps {
  practitionerId: string;
}

export function AvailabilityCalendar({ practitionerId }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendar, setCalendar] = useState<BookingCalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add refresh function that can be called from parent
  const refreshCalendar = () => {
    fetchCalendar();
  };

  // Expose refresh function to parent component
  useImperativeHandle(forwardRef(() => null), () => ({
    refreshCalendar
  }));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, practitionerId]);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const calendarData: BookingCalendarDay[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Build a date string in local time (avoid UTC shifting a day)
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        
        const { data: slots, error } = await supabase
          .rpc('generate_availability_slots', {
            p_practitioner_id: practitionerId,
            p_date: dateStr
          });

        if (error) {
          console.error('Error fetching slots for', dateStr, error);
        } else {
          // Debug: Log detailed calendar data
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
          console.log(`=== CALENDAR REQUEST ===`);
          console.log(`Date: ${dateStr}, Day of week: ${dayOfWeek} (${dayName})`);
          console.log(`Requesting slots for day_of_week: ${dayOfWeek}`);
          console.log(`Slots returned: ${slots?.length || 0}`);
          if (slots && slots.length > 0) {
            console.log(`🔍 AVAILABILITY FOUND: ${dateStr} (${dayName}) with ${slots.length} slots`);
          }
          console.log(`=== END CALENDAR REQUEST ===\n`);
        }

        calendarData.push({
          date: dateStr,
          slots: slots || [],
          is_available: slots && slots.length > 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setCalendar(calendarData);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDayClass = (day: BookingCalendarDay) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isToday = day.date === today;
    const isPast = day.date < today;
    
    let baseClass = 'p-3 border rounded-lg cursor-pointer transition-colors ';
    
    if (isPast) {
      baseClass += 'bg-gray-100 text-gray-400 cursor-not-allowed';
    } else if (isToday) {
      baseClass += 'bg-yellow-50 border-yellow-200';
    } else if (day.is_available) {
      baseClass += 'bg-green-50 border-green-200 hover:bg-green-100';
    } else {
      baseClass += 'bg-red-50 border-red-200 hover:bg-red-100';
    }
    
    return baseClass;
  };

  // Create a simple calendar grid - start from the correct Sunday
  const createCalendarGrid = () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Calculate how many days to go back to reach the Sunday before the first day
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);

    const weeks = [];
    let currentDate = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays = [];

      for (let day = 0; day < 7; day++) {
        const y = currentDate.getFullYear();
        const m = String(currentDate.getMonth() + 1).padStart(2, '0');
        const d = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const dayData = calendar.find(d => d.date === dateStr);

        // Debug: Log the grid positioning
        const dayOfWeek = currentDate.getDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        const gridColumn = day; // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
        console.log(`Grid: Column ${gridColumn} (${dayNames[gridColumn]}) = ${dateStr}, Day ${currentDate.getDate()}, Actual day: ${dayOfWeek} (${dayName}), Has data: ${!!dayData}, Slots: ${dayData?.slots?.length || 0}`);

        weekDays.push({
          date: dateStr,
          day: currentDate.getDate(),
          isCurrentMonth: currentDate.getMonth() === currentMonth.getMonth(),
          dayData: dayData || { date: dateStr, slots: [], is_available: false }
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(weekDays);
    }

    return weeks;
  };

  const weeks = createCalendarGrid();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Availability Calendar</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-semibold">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="text-gray-600 text-sm">Loading availability calendar...</p>
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {weeks.map((week, weekIndex) => 
          week.map((day, dayIndex) => (
            <div
              key={`${weekIndex}-${dayIndex}`}
              className={`p-3 border rounded-lg transition-colors ${
                !day.isCurrentMonth 
                  ? 'border-transparent bg-transparent text-gray-300' 
                  : day.dayData.is_available
                    ? 'border-green-200 bg-green-50 hover:bg-green-100 cursor-pointer'
                    : 'border-gray-200 bg-gray-50'
              } ${selectedDate === day.date ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => {
                if (day.isCurrentMonth && day.dayData.is_available) {
                  handleDateClick(day.date);
                }
              }}
            >
              <div className="text-sm font-medium">
                {day.day}
              </div>
              {day.isCurrentMonth && (
                <>
                  {day.dayData.slots.length > 0 ? (
                    <div className="text-xs mt-1 space-y-1">
                      <div className="text-green-600">
                        {day.dayData.slots.filter(slot => slot.is_available && slot.current_bookings < slot.max_bookings).length} available
                      </div>
                      <div className="text-red-600">
                        {day.dayData.slots.filter(slot => !slot.is_available || slot.current_bookings >= slot.max_bookings).length} booked
                      </div>
                      <div className="text-gray-500">
                        {day.dayData.slots[0]?.start_time} - {day.dayData.slots[day.dayData.slots.length - 1]?.end_time}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs mt-1 text-red-600">
                      No availability
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
        </div>
      )}

      {/* Time Slots for Selected Date */}
      {!loading && selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">
            Available Time Slots for {formatDate(selectedDate)}
          </h3>
          <div className="space-y-2">
            {(() => {
              const selectedDay = calendar.find(day => day.date === selectedDate);
              
              if (!selectedDay || selectedDay.slots.length === 0) {
                return (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        No available time slots for this date
                      </span>
                    </div>
                  </div>
                );
              }

              return selectedDay.slots.map((slot, index) => {
                const isAvailable = slot.is_available && slot.current_bookings < slot.max_bookings;
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-md transition-colors ${
                      isAvailable 
                        ? 'bg-green-50 border-green-200 hover:bg-green-100 cursor-pointer'
                        : 'bg-red-50 border-red-200 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${isAvailable ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`font-medium ${isAvailable ? 'text-green-800' : 'text-red-800'}`}>
                          {slot.start_time} - {slot.end_time}
                        </span>
                      </div>
                      <div className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {isAvailable 
                          ? `${slot.max_bookings - slot.current_bookings} slots available`
                          : 'Booked'
                        }
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}