import React, { useState } from 'react';
import { X, Plus, Trash2, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { PackageFormData } from '../../types/packages';

interface PackageFormProps {
  practitionerId: string;
  onClose: () => void;
  onSuccess: () => void;
  editPackage?: any;
}

const currencies = [
  { value: 'EUR', label: '€ (EUR)' },
  { value: 'GBP', label: '£ (GBP)' },
  { value: 'USD', label: '$ (USD)' },
  { value: 'CHF', label: 'CHF' }
];

export function PackageForm({ practitionerId, onClose, onSuccess, editPackage }: PackageFormProps) {
  const [formData, setFormData] = useState<PackageFormData>({
    name: editPackage?.name || '',
    description: editPackage?.description || '',
    price: editPackage?.price?.toString() || '',
    currency: editPackage?.currency || 'EUR',
    sessions_included: editPackage?.sessions_included?.toString() || '',
    duration_weeks: editPackage?.duration_weeks?.toString() || '',
    features: editPackage?.features || ['']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.sessions_included || !formData.duration_weeks) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const packageData = {
        practitioner_id: practitionerId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        currency: formData.currency,
        sessions_included: parseInt(formData.sessions_included),
        duration_weeks: parseInt(formData.duration_weeks),
        features: formData.features.filter(f => f.trim()),
        is_active: true
      };

      if (editPackage) {
        const { error: updateError } = await supabase
          .from('service_packages')
          .update(packageData)
          .eq('id', editPackage.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('service_packages')
          .insert([packageData]);
        
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving package:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent-text/10">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-accent-text mr-3" />
            <h2 className="text-xl font-semibold text-content">
              {editPackage ? 'Edit Package' : 'Create Service Package'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-content/60 hover:text-content rounded-full hover:bg-accent-base/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Package Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="e.g., 3-Session Wellness Package"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Price *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-accent-text/20 rounded-l-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                    placeholder="0.00"
                    required
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="px-3 py-3 border border-l-0 border-accent-text/20 rounded-r-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20 bg-white"
                  >
                    {currencies.map(curr => (
                      <option key={curr.value} value={curr.value}>
                        {curr.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-content mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                rows={3}
                placeholder="Describe what's included in this package..."
                required
              />
            </div>

            {/* Package Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Sessions Included *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sessions_included}
                  onChange={(e) => setFormData(prev => ({ ...prev, sessions_included: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="e.g., 3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  Duration (weeks) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_weeks: e.target.value }))}
                  className="w-full px-4 py-3 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                  placeholder="e.g., 4"
                  required
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-content">
                  Package Features
                </label>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm text-accent-text hover:text-accent-text/80 flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Feature
                </button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-accent-text/20 rounded-lg focus:border-accent-text focus:ring-1 focus:ring-accent-text/20"
                      placeholder="e.g., Personalized wellness plan"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-accent-text/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-content hover:text-content/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-accent-text rounded-lg hover:bg-accent-text/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : (editPackage ? 'Update Package' : 'Create Package')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}