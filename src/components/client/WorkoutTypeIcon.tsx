
import React from 'react';

export type WorkoutType = string;

interface WorkoutTypeIconProps {
  type: WorkoutType;
  className?: string;
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ type, className = '' }) => {
  const getIconForType = () => {
    switch (type) {
      case 'strength':
        return '🏋️'; // Weight lifting
      case 'cardio':
        return '🏃'; // Running
      case 'flexibility':
        return '🧘'; // Yoga/Flexibility
      case 'bodyweight':
        return '💪'; // Muscle/Bodyweight
      case 'rest_day':
        return '😴'; // Rest day
      case 'custom':
        return '✨'; // Custom workout
      case 'one_off':
        return '🎯'; // One-off workout
      default:
        return '📝'; // Default icon
    }
  };

  return (
    <span className={`workout-type-icon ${className}`} role="img" aria-label={`${type} workout`}>
      {getIconForType()}
    </span>
  );
};

// Export the workout types with labels for use in dropdowns
export const WORKOUT_TYPES: {value: string; label: string; icon: string}[] = [
  { value: 'strength', label: 'Strength', icon: '🏋️' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'custom', label: 'Custom', icon: '✨' },
  { value: 'one_off', label: 'One-off', icon: '🎯' },
  { value: 'rest_day', label: 'Rest Day', icon: '😴' }
];
