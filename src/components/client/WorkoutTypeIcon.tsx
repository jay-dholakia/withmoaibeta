
import React from 'react';
import { Dumbbell, Zap, Fingerprint, Activity, Yoga, Running, Coffee, CirclePlus } from 'lucide-react';

export type WorkoutType = 'strength' | 'hiit' | 'mobility' | 'cardio' | 'yoga' | 'running' | 'rest' | 'custom';

interface WorkoutTypeIconProps {
  type: WorkoutType | null;
  className?: string;
  colorOverride?: string;
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ 
  type, 
  className = "", 
  colorOverride 
}) => {
  const iconClass = colorOverride || getIconColorForType(type);
  
  switch(type) {
    case 'strength':
      return <Dumbbell className={`${iconClass} ${className}`} />;
    case 'hiit':
      return <Zap className={`${iconClass} ${className}`} />;
    case 'mobility':
      return <Fingerprint className={`${iconClass} ${className}`} />;
    case 'cardio':
      return <Activity className={`${iconClass} ${className}`} />;
    case 'yoga':
      return <Yoga className={`${iconClass} ${className}`} />;
    case 'running':
      return <Running className={`${iconClass} ${className}`} />;
    case 'rest':
      return <Coffee className={`${iconClass} ${className}`} />;
    case 'custom':
    default:
      return <CirclePlus className={`${iconClass} ${className}`} />;
  }
};

export const getIconColorForType = (type: WorkoutType | null): string => {
  switch(type) {
    case 'strength':
      return 'text-blue-500';
    case 'hiit':
      return 'text-orange-500';
    case 'mobility':
      return 'text-purple-500';
    case 'cardio':
      return 'text-red-500';
    case 'yoga':
      return 'text-teal-500';
    case 'running':
      return 'text-green-500';
    case 'rest':
      return 'text-gray-500';
    case 'custom':
    default:
      return 'text-indigo-500';
  }
};
