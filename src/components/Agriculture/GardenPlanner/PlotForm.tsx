import React, { useState } from 'react';
import { ElementType } from './types';

interface PlotFormProps {
  initialValues?: Omit<ElementType, 'id' | 'position'>;
  onSubmit: (values: Omit<ElementType, 'id' | 'position'>) => void;
  onCancel: () => void;
}

export function PlotForm({ initialValues, onSubmit, onCancel }: PlotFormProps) {
  const [values, setValues] = useState<Omit<ElementType, 'id' | 'position'>>({
    name: initialValues?.name || '',
    type: initialValues?.type || 'vegetable',
    size: initialValues?.size || { width: 100, height: 100 },
    plantedWith: initialValues?.plantedWith || '',
    plantedDate: initialValues?.plantedDate || '',
    notes: initialValues?.notes || ''
  });
  const [errors, setErrors] = useState<{width?: string; height?: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate width and height
    const newErrors = {};
    if (!values.size.width || values.size.width < 1) {
      newErrors.width = 'Width must be at least 1';
    }
    if (!values.size.height || values.size.height < 1) {
      newErrors.height = 'Height must be at least 1';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onSubmit(values);
  };

  const handleNumberChange = (field: 'width' | 'height', value: string) => {
    const numValue = value === '' ? '' : parseInt(value);
    setValues({
      ...values,
      size: {
        ...values.size,
        [field]: numValue === '' ? '' : (isNaN(numValue as number) ? 0 : numValue)
      }
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-content mb-2">
          Plot Name *
        </label>
        <input
          type="text"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
          placeholder="e.g., Tomato Bed, Herb Garden"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content mb-2">
          Plot Type *
        </label>
        <select
          required
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value as ElementType['type'] })}
          className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
        >
          <option value="vegetable">Vegetable Bed</option>
          <option value="herb">Herb Garden</option>
          <option value="flower">Flower Bed</option>
          <option value="fruit">Fruit Garden</option>
          <option value="tree">Tree</option>
          <option value="water">Water Feature</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content mb-2">
            Width (cm) *
          </label>
          <input
            type="number"
            required
            min="1"
            max="50000"
            value={values.size.width === '' ? '' : values.size.width}
            onChange={(e) => handleNumberChange('width', e.target.value)}
            className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
          />
          {errors.width && <p className="mt-1 text-sm text-red-500">{errors.width}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-content mb-2">
            Height (cm) *
          </label>
          <input
            type="number"
            required
            min="1"
            max="50000"
            value={values.size.height === '' ? '' : values.size.height}
            onChange={(e) => handleNumberChange('height', e.target.value)}
            className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
          />
          {errors.height && <p className="mt-1 text-sm text-red-500">{errors.height}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-content mb-2">
          What are you growing?
        </label>
        <input
          type="text"
          value={values.plantedWith || ''}
          onChange={(e) => setValues({ ...values, plantedWith: e.target.value })}
          className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
          placeholder="e.g., Tomatoes, Basil"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content mb-2">
          Planting Date
        </label>
        <input
          type="date"
          value={values.plantedDate || ''}
          onChange={(e) => setValues({ ...values, plantedDate: e.target.value })}
          className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-content mb-2">
          Notes
        </label>
        <textarea
          value={values.notes || ''}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          className="w-full px-4 py-2.5 border border-accent-text/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-text focus:border-accent-text bg-white"
          rows={3}
          placeholder="Additional notes about this plot"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-accent-text/10 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-content hover:text-content/80"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2.5 text-sm font-medium text-white bg-accent-text rounded-md hover:bg-accent-text/90 shadow-sm"
        >
          {initialValues ? 'Update Plot' : 'Add Plot'}
        </button>
      </div>
    </form>
  );
}