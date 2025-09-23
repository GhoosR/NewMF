import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { ElementType } from './types';

interface PlotProps {
  plot: ElementType;
  isSelected: boolean;
  onClick: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onDelete: () => void;
  onEdit: () => void;
  isOwner: boolean;
}

export function Plot({ plot, isSelected, onClick, onMouseDown, onTouchStart, onDelete, onEdit, isOwner }: PlotProps) {
  const getPlotColor = () => {
    switch (plot.type) {
      case 'vegetable':
        return 'bg-vegetable-plot-bg bg-cover bg-center'; // Using the custom background image
      case 'herb':
        return 'bg-herb-plot-bg bg-cover bg-center';
      case 'flower':
        return 'bg-flower-plot-bg bg-cover bg-center';
      case 'fruit':
        return 'bg-fruit-plot-bg bg-cover bg-center';
      case 'tree':
        return 'bg-tree-plot-bg bg-cover bg-center';
      case 'water':
        return 'bg-water-plot-bg bg-cover bg-center';
      default:
        return 'bg-path-plot-bg bg-cover bg-center';
    }
  };

  const getPlotBorderColor = () => {
    switch (plot.type) {
      case 'vegetable':
        return 'border-green-500';
      case 'herb':
        return 'border-emerald-500';
      case 'flower':
        return 'border-pink-500';
      case 'fruit':
        return 'border-red-500';
      case 'tree':
        return 'border-amber-500';
      case 'water':
        return 'border-blue-500';
      default:
        return 'border-gray-500';
    }
  };

  return (
    <div
      className={`absolute rounded-lg shadow-sm cursor-pointer transition-all duration-200 overflow-hidden ${
        isSelected ? `border-2 ${getPlotBorderColor()} z-10 ring-2 ring-white` : 'border border-gray-300'
      }`}
      style={{
        left: `${plot.position.x}px`,
        top: `${plot.position.y}px`,
        width: `${plot.size.width}px`,
        height: `${plot.size.height}px`,
        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isOwner) onClick();
      }}
      onMouseDown={isOwner ? onMouseDown : undefined}
      onTouchStart={isOwner ? onTouchStart : undefined}
    >
      {/* Background with the image or color */}
      <div className={`absolute inset-0 ${getPlotColor()}`} />
      
      {/* Overlay */}
      
      {/* Content */}
      <div className="p-2 h-full flex flex-col relative z-10">
        <div className="text-xs font-medium truncate text-gray-800 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
          {plot.name}
        </div>
        {plot.plantedWith && (
          <div className="text-xs text-gray-700 truncate mt-1 bg-white/70 px-1 py-0.5 rounded">
            {plot.plantedWith}
          </div>
        )}
        
        {isSelected && isOwner && (
          <div className="absolute top-1 right-1 flex space-x-1 bg-white/70 rounded-full p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-1 bg-white rounded-full text-gray-600 hover:text-gray-900 shadow-sm"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              className="p-1 bg-white rounded-full text-red-600 hover:text-red-700 shadow-sm"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}