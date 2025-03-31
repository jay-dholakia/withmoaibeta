
import React from 'react';

export type WorkoutType = 'strength' | 'bodyweight' | 'cardio' | 'flexibility' | 'rest_day' | 'custom' | 'one_off';

interface WorkoutTypeIconProps {
  type: WorkoutType;
  className?: string;
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ 
  type, 
  className = ''
}) => {
  const getIconForType = () => {
    switch (type) {
      case 'strength':
        return '🏋️'; // Weightlifting emoji
      case 'bodyweight':
        return '💪'; // Muscle emoji
      case 'cardio':
        return '🏃'; // Running emoji
      case 'flexibility':
        return '🧘'; // Yoga/flexibility emoji
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

  return (
    <span 
      className={`workout-type-icon ${className}`} 
      role="img" 
      aria-label={`${type} workout`}
      style={{ fontSize: '14px', lineHeight: 1 }}
    >
      {getIconForType()}
    </span>
  );
};

// Export the workout types with labels for use in dropdowns
export const WORKOUT_TYPES: {value: WorkoutType; label: string; icon: React.ReactNode}[] = [
  { value: 'strength', label: 'Strength', icon: '🏋️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'cardio', label: 'Cardio', icon: '🏃' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'custom', label: 'Custom', icon: '✨' },
  { value: 'one_off', label: 'One-off', icon: '🎯' },
  { value: 'rest_day', label: 'Rest Day', icon: '😴' }
];
