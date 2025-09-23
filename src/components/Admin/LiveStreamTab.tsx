import React, { useState, useEffect } from 'react';
import { Save, Clock, User, Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ScheduleItem {
  id: string;
  day_of_week: number;
  time: string;
  title: string;
  host: string;
  created_at: string;
  updated_at: string;
}

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export function LiveStreamTab() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchSchedule = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('livestream_schedule')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('time', { ascending: true });

      if (fetchError) throw fetchError;
      setSchedule(data || []);
    } catch (err: any) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleSave = async (item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSaving(true);
      setError(null);

      if (editingItem) {
        // Update existing item
        const { error: updateError } = await supabase
          .from('livestream_schedule')
          .update({
            day_of_week: item.day_of_week,
            time: item.time,
            title: item.title,
            host: item.host,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (updateError) throw updateError;
      } else {
        // Create new item
        const { error: insertError } = await supabase
          .from('livestream_schedule')
          .insert([{
            day_of_week: item.day_of_week,
            time: item.time,
            title: item.title,
            host: item.host
          }]);

        if (insertError) throw insertError;
      }

      setEditingItem(null);
      setShowAddForm(false);
      await fetchSchedule();
    } catch (err: any) {
      console.error('Error saving schedule item:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this schedule item?')) return;

    try {
      const { error } = await supabase
        .from('livestream_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchSchedule();
    } catch (err: any) {
      console.error('Error deleting schedule item:', err);
      setError(err.message);
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
        <h2 className="text-xl font-semibold text-content">Live Stream Schedule</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-accent-text text-white rounded-lg hover:bg-accent-text/90 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedule.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {DAYS[item.day_of_week]}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      {item.time}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="h-4 w-4 mr-2" />
                      {item.host}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="text-accent-text hover:text-accent-text/80"
                        title="Edit session"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {schedule.length === 0 && !loading && (
        <div className="text-center py-8 text-content/60">
          No schedule items yet. Add your first session to get started.
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {(showAddForm || editingItem) && (
        <ScheduleForm
          item={editingItem}
          onClose={() => {
            setShowAddForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}

interface ScheduleFormProps {
  item?: ScheduleItem | null;
  onClose: () => void;
  onSave: (item: Omit<ScheduleItem, 'id' | 'created_at' | 'updated_at'>) => void;
  saving: boolean;
}

function ScheduleForm({ item, onClose, onSave, saving }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    day_of_week: item?.day_of_week ?? 1,
    time: item?.time ?? '09:00',
    title: item?.title ?? '',
    host: item?.host ?? ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-medium text-content mb-4">
            {item ? 'Edit Session' : 'Add New Session'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Day of Week
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                required
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Session Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., Morning Meditation"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Host Name
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                placeholder="e.g., Sarah Chen"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : (item ? 'Update Session' : 'Add Session')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}