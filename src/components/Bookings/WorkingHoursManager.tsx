import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PractitionerWorkingHours, WorkingHoursData } from '../../types/bookings';

interface WorkingHoursManagerProps {
  practitionerId: string;
  onWorkingHoursUpdated?: () => void;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function WorkingHoursManager({ practitionerId, onWorkingHoursUpdated }: WorkingHoursManagerProps) {
  const [workingHours, setWorkingHours] = useState<PractitionerWorkingHours[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newWorkingHours, setNewWorkingHours] = useState<WorkingHoursData>({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    slot_duration_minutes: 60,
    max_bookings_per_slot: 1,
    is_active: true
  });

  useEffect(() => {
    fetchWorkingHours();
  }, [practitionerId]);

  const fetchWorkingHours = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('practitioner_working_hours')
        .select('*')
        .eq('practitioner_id', practitionerId)
        .order('day_of_week');

      if (error) throw error;
      
      // Debug: Log the working hours data
      console.log('=== WORKING HOURS FETCH ===');
      console.log('Working Hours Data:', data);
      data?.forEach(wh => {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][wh.day_of_week];
        console.log(`DB Working Hours: day_of_week=${wh.day_of_week} (${dayName}), start_time=${wh.start_time}, end_time=${wh.end_time}`);
      });
      console.log('=== END WORKING HOURS FETCH ===\n');
      
      setWorkingHours(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load working hours');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkingHours = async (dayOfWeek: number, data: WorkingHoursData) => {
    setLoading(true);
    try {
      // Debug: Log what's being saved
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      console.log('=== WORKING HOURS SAVE ===');
      console.log(`UI Day: ${dayName} (index ${dayOfWeek}) → DB Day of Week: ${dayOfWeek}`);
      console.log(`Saving Working Hours: day_of_week=${dayOfWeek} (${dayName}), start_time=${data.start_time}, end_time=${data.end_time}`);
      
      const { error } = await supabase
        .from('practitioner_working_hours')
        .upsert([{
          practitioner_id: practitionerId,
          day_of_week: dayOfWeek,
          start_time: data.start_time,
          end_time: data.end_time,
          slot_duration_minutes: data.slot_duration_minutes,
          max_bookings_per_slot: data.max_bookings_per_slot,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'practitioner_id,day_of_week'
        });

      if (error) throw error;
      
      setEditingDay(null);
      await fetchWorkingHours();
      onWorkingHoursUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save working hours');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkingHours = async (dayOfWeek: number) => {
    if (!window.confirm('Are you sure you want to delete working hours for this day?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('practitioner_working_hours')
        .delete()
        .eq('practitioner_id', practitionerId)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;
      
      await fetchWorkingHours();
      onWorkingHoursUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Failed to delete working hours');
    } finally {
      setLoading(false);
    }
  };

  const getWorkingHoursForDay = (dayOfWeek: number) => {
    return workingHours.find(wh => wh.day_of_week === dayOfWeek);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  if (loading && workingHours.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#F59E0B' }}></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Working Hours</h2>
        <p className="text-sm text-gray-600">Set your default availability for each day of the week</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((dayName, dayIndex) => {
          // Convert UI day index to database day of week
          // UI: Monday=0, Tuesday=1, ..., Sunday=6
          // DB: Sunday=0, Monday=1, ..., Saturday=6
          const dayOfWeek = dayIndex === 6 ? 0 : dayIndex + 1;
          const dayHours = getWorkingHoursForDay(dayOfWeek);
          const isEditing = editingDay === dayOfWeek;
          
          // Debug: Log the day mapping
          console.log(`UI Day: ${dayName} (index ${dayIndex}) → DB Day of Week: ${dayOfWeek}`);
          if (dayHours) {
            console.log(`Found working hours for ${dayName}: ${dayHours.start_time} - ${dayHours.end_time}`);
          }

          return (
            <div key={dayOfWeek} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-medium text-gray-900">{dayName}</h3>
                  {dayHours?.is_active && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <button
                      onClick={() => setEditingDay(null)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          if (dayHours) {
                            setNewWorkingHours({
                              day_of_week: dayOfWeek,
                              start_time: dayHours.start_time,
                              end_time: dayHours.end_time,
                              slot_duration_minutes: dayHours.slot_duration_minutes,
                              max_bookings_per_slot: dayHours.max_bookings_per_slot,
                              is_active: dayHours.is_active
                            });
                          } else {
                            setNewWorkingHours({
                              day_of_week: dayOfWeek,
                              start_time: '09:00',
                              end_time: '17:00',
                              slot_duration_minutes: 60,
                              max_bookings_per_slot: 1,
                              is_active: true
                            });
                          }
                          setEditingDay(dayOfWeek);
                        }}
                        className="px-3 py-1 text-sm text-white rounded-md"
                        style={{ backgroundColor: '#F59E0B' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59E0B'}
                      >
                        {dayHours ? 'Edit' : 'Add Hours'}
                      </button>
                      {dayHours && (
                        <button
                          onClick={() => handleDeleteWorkingHours(dayOfWeek)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newWorkingHours.start_time}
                        onChange={(e) => setNewWorkingHours(prev => ({ ...prev, start_time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newWorkingHours.end_time}
                        onChange={(e) => setNewWorkingHours(prev => ({ ...prev, end_time: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slot Duration (minutes)
                      </label>
                      <select
                        value={newWorkingHours.slot_duration_minutes}
                        onChange={(e) => setNewWorkingHours(prev => ({ ...prev, slot_duration_minutes: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Bookings per Slot
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newWorkingHours.max_bookings_per_slot}
                        onChange={(e) => setNewWorkingHours(prev => ({ ...prev, max_bookings_per_slot: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newWorkingHours.is_active}
                        onChange={(e) => setNewWorkingHours(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setEditingDay(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveWorkingHours(dayOfWeek, newWorkingHours)}
                      disabled={loading}
                      className="px-4 py-2 text-white rounded-md disabled:opacity-50 flex items-center"
                      style={{ backgroundColor: '#F59E0B' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59E0B'}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : dayHours ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{formatTime(dayHours.start_time)} - {formatTime(dayHours.end_time)}</span>
                    </div>
                    <div>
                      <span>Slots: {formatDuration(dayHours.slot_duration_minutes)}</span>
                    </div>
                    <div>
                      <span>Max: {dayHours.max_bookings_per_slot} per slot</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-gray-500">
                  No working hours set for this day
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
