import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../Modal';
import { crops } from '../../lib/constants/crops';

interface TaskModalProps {
  fieldId: string;
  selectedDate?: Date;
  onClose: () => void;
  onSuccess: () => void;
}

const taskTypes = [
  { value: 'planting', label: 'Planting' },
  { value: 'watering', label: 'Watering' },
  { value: 'harvesting', label: 'Harvesting' },
  { value: 'fertilising', label: 'Fertilising' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'other', label: 'Other' }
] as const;

export function TaskModal({ fieldId, selectedDate, onClose, onSuccess }: TaskModalProps) {
  // Format the selected date for the input field (YYYY-MM-DD)
  const formattedDate = selectedDate 
    ? new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000))
        .toISOString()
        .split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    details: '',
    date: formattedDate,
    task_type: 'planting' as typeof taskTypes[number]['value'],
    crop_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get available crops for dropdown
  const availableCrops = Object.keys(crops).map(key => ({
    value: key,
    label: crops[key].name
  }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.task_type) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase
        .from('field_tasks')
        .insert([{
          field_id: fieldId,
          user_id: user.id,
          title: formData.title,
          details: formData.details,
          date: formData.date,
          task_type: formData.task_type,
          crop_name: formData.crop_name || null
        }]);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Task" onClose={onClose} fullScreenOnMobile={true}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Details
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 whitespace-pre-line"
              rows={3}
              placeholder="Add task details (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content mb-2">
              Task Type *
            </label>
            <select
              value={formData.task_type}
              onChange={(e) => setFormData(prev => ({ ...prev, task_type: e.target.value as typeof formData.task_type }))}
              className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              required
            >
              {taskTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {formData.task_type === 'planting' && (
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Crop (Optional)
              </label>
              <select
                value={formData.crop_name}
                onChange={(e) => setFormData(prev => ({ ...prev, crop_name: e.target.value }))}
                className="w-full px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
              >
                <option value="">Select a crop (optional)</option>
                {availableCrops.map(crop => (
                  <option key={crop.value} value={crop.value}>
                    {crop.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-content/60">
                Select a crop to track harvest dates and growing progress
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-content hover:text-content/80 rounded-md hover:bg-accent-base/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
    </Modal>
  );
}