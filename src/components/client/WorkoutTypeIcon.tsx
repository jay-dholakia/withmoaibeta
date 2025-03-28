
import React from 'react';

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'bodyweight' | 'rest_day' | 'custom' | 'one_off';

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
        return '🏃'; // Runner
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
