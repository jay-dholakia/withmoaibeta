
import React from 'react';
import { Dumbbell, PersonStanding, Heart, Yoga } from 'lucide-react';

export type WorkoutType = 'strength' | 'bodyweight' | 'cardio' | 'flexibility' | 'rest_day' | 'custom' | 'one_off';

interface WorkoutTypeIconProps {
  type: WorkoutType;
  className?: string;
  size?: number;
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ 
  type, 
  className = '',
  size = 16 
}) => {
  const getIconForType = () => {
    switch (type) {
      case 'strength':
        return <Dumbbell size={size} className="text-gray-800" />;
      case 'bodyweight':
        return <PersonStanding size={size} className="text-gray-800" />;
      case 'cardio':
        return <Heart size={size} className="text-gray-800" />;
      case 'flexibility':
        return <Yoga size={size} className="text-gray-800" />;
      case 'rest_day':
        return '😴'; // Rest day emoji
      case 'custom':
        return '✨'; // Custom workout
      case 'one_off':
        return '🎯'; // One-off workout
      default:
        return '📝'; // Default icon
    }
  };

  // If it's an emoji, render as a span
  if (typeof getIconForType() === 'string') {
    return (
      <span className={`workout-type-icon ${className}`} role="img" aria-label={`${type} workout`}>
        {getIconForType()}
      </span>
    );
  }

  // If it's a Lucide icon component, render it directly
  return (
    <span className={`workout-type-icon ${className}`} aria-label={`${type} workout`}>
      {getIconForType()}
    </span>
  );
};

// Export the workout types with labels for use in dropdowns
export const WORKOUT_TYPES: {value: WorkoutType; label: string; icon: React.ReactNode}[] = [
  { value: 'strength', label: 'Strength', icon: <Dumbbell size={16} /> },
  { value: 'bodyweight', label: 'Bodyweight', icon: <PersonStanding size={16} /> },
  { value: 'cardio', label: 'Cardio', icon: <Heart size={16} /> },
  { value: 'flexibility', label: 'Flexibility', icon: <Yoga size={16} /> },
  { value: 'custom', label: 'Custom', icon: '✨' },
  { value: 'one_off', label: 'One-off', icon: '🎯' },
  { value: 'rest_day', label: 'Rest Day', icon: '😴' }
];
