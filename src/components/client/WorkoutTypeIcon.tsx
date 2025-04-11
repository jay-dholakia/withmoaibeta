
import React from 'react';
import { StandardWorkoutType } from '@/types/workout';

export type WorkoutType = StandardWorkoutType;

interface WorkoutTypeIconProps {
  type: WorkoutType;
  className?: string;
  size?: 'sm' | 'md' | 'lg'; // Add size prop
  colorOverride?: string; // Add colorOverride prop
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ 
  type, 
  className = '',
  size = 'md', // Default to medium size
  colorOverride // Add colorOverride parameter
}) => {
  const getIconForType = () => {
    switch (type) {
      case 'strength':
        return '🏋️'; // Weightlifting emoji
      case 'bodyweight':
        return '💪'; // Muscle emoji
      case 'cardio':
        return '🏃'; // Running emoji - updated for cardio workouts
      case 'flexibility':
        return '🧘'; // Yoga/flexibility emoji
      case 'rest_day':
        return '😌'; // Updated Rest day emoji
      case 'custom':
        return '✨'; // Custom workout
      case 'one_off':
        return '🎯'; // One-off workout
      case 'hiit':
        return '⚡'; // HIIT workout
      case 'sport':
        return '🎾'; // Sport activity
      case 'swimming':
        return '🏊'; // Swimming
      case 'cycling':
        return '🚴'; // Cycling
      case 'dance':
        return '💃'; // Dance workout
      default:
        return '📝'; // Default icon
    }
  };

  // Determine font size based on size prop
  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return '12px';
      case 'lg':
        return '18px';
      case 'md':
      default:
        return '14px';
    }
  };

  return (
    <span 
      className={`workout-type-icon ${className}`} 
      role="img" 
      aria-label={`${type} workout`}
      style={{ 
        fontSize: getFontSize(), 
        lineHeight: 1,
        color: colorOverride // Apply colorOverride if provided
      }}
    >
      {getIconForType()}
    </span>
  );
};

// Export the workout types with labels for use in dropdowns
export const WORKOUT_TYPES: {value: WorkoutType; label: string; icon: React.ReactNode}[] = [
  { value: 'strength', label: 'Strength', icon: '🏋️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' }, // Updated icon for cardio
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'hiit', label: 'HIIT', icon: '⚡' },
  { value: 'sport', label: 'Sport', icon: '🎾' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'dance', label: 'Dance', icon: '💃' }
  // Removed: custom, one_off, rest_day, core as requested
];
