import React from 'react';
import { Sprout, Droplets, Scissors, Shovel, Bug, Leaf, HelpCircle } from 'lucide-react';

interface TaskTypeIconProps {
  type: string;
  className?: string;
  size?: number;
}

export function TaskTypeIcon({ type, className = '', size = 16 }: TaskTypeIconProps) {
  switch (type) {
    case 'planting':
      return <Sprout className={className} size={size} />;
    case 'watering':
      return <Droplets className={className} size={size} />;
    case 'harvesting':
      return <Scissors className={className} size={size} />;
    case 'fertilising':
      return <Shovel className={className} size={size} />;
    case 'weeding':
      return <Leaf className={className} size={size} />; 
    case 'pruning':
      return <Scissors className={className} size={size} />;
    case 'mulching':
      return <Shovel className={className} size={size} />;
    case 'pest_control':
      return <Bug className={className} size={size} />;
    case 'other':
      return <HelpCircle className={className} size={size} />;
    default:
      return <HelpCircle className={className} size={size} />;
  }
}