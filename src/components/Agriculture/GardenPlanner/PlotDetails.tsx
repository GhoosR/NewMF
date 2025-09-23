import React from 'react';
import { Edit, Trash2, Calendar, Leaf, FileText, TreeDeciduous, Flower, Droplets } from 'lucide-react';
import { ElementType } from './types';

interface PlotDetailsProps {
  plot: ElementType;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlotDetails({ plot, onEdit, onDelete }: PlotDetailsProps) {
  const getTypeLabel = (type: ElementType['type']) => {
    switch (type) {
      case 'vegetable':
        return 'Vegetable Bed';
      case 'herb':
        return 'Herb Garden';
      case 'flower':
        return 'Flower Bed';
      case 'fruit':
        return 'Fruit Garden';
      case 'tree':
        return 'Tree';
      case 'water':
        return 'Water Feature';
      default:
        return 'Other';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-accent-text/10 p-5">
      <div className="flex justify-between items-start mb-5">
        <h3 className="text-lg font-medium text-content flex items-center">
          <span className="w-2 h-2 rounded-full bg-accent-text mr-2"></span>
          {plot.name}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-1.5 text-content/60 hover:text-content hover:bg-accent-base/10 rounded-full"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-accent-base/5 rounded-lg p-4">
          <div className="text-sm font-medium text-content mb-2 flex items-center">
            {plot.type === 'vegetable' && <Leaf className="h-4 w-4 mr-2 text-green-600" />}
            {plot.type === 'herb' && <Leaf className="h-4 w-4 mr-2 text-emerald-600" />}
            {plot.type === 'flower' && <Flower className="h-4 w-4 mr-2 text-pink-600" />}
            {plot.type === 'fruit' && <Leaf className="h-4 w-4 mr-2 text-red-600" />}
            {plot.type === 'tree' && <TreeDeciduous className="h-4 w-4 mr-2 text-amber-600" />}
            {plot.type === 'water' && <Droplets className="h-4 w-4 mr-2 text-blue-600" />}
            Type
          </div>
          <div className="text-content/80 font-medium">{getTypeLabel(plot.type)}</div>
        </div>

        <div className="bg-accent-base/5 rounded-lg p-4">
          <div className="text-sm font-medium text-content mb-2">Size</div>
          <div className="text-content/80 font-medium">{plot.size.width} × {plot.size.height} cm</div>
        </div>

        {plot.plantedWith && (
          <div className="bg-accent-base/5 rounded-lg p-4">
            <div className="flex items-center text-sm font-medium text-content mb-2">
              <Leaf className="h-4 w-4 mr-1 text-green-600" />
              <span>What are you growing?</span>
            </div>
            <div className="text-content/80 font-medium">{plot.plantedWith}</div>
          </div>
        )}

        {plot.plantedDate && (
          <div className="bg-accent-base/5 rounded-lg p-4">
            <div className="flex items-center text-sm font-medium text-content mb-2">
              <Calendar className="h-4 w-4 mr-1 text-blue-600" />
              <span>Planted On</span>
            </div>
            <div className="text-content/80 font-medium">{new Date(plot.plantedDate).toLocaleDateString()}</div>
          </div>
        )}

        {plot.notes && (
          <div className="bg-accent-base/5 rounded-lg p-4">
            <div className="flex items-center text-sm font-medium text-content mb-2">
              <FileText className="h-4 w-4 mr-1 text-gray-600" />
              <span>Notes</span>
            </div>
            <div className="text-content/80 whitespace-pre-line bg-white p-3 rounded-md border border-accent-text/10">{plot.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}