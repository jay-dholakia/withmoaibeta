
import React from 'react';
import { Dumbbell } from 'lucide-react';
import { StandardWorkoutType } from '@/types/workout';

export type WorkoutType = StandardWorkoutType;

interface WorkoutTypeIconProps {
  type: WorkoutType;
  className?: string;
  size?: 'sm' | 'md' | 'lg'; 
  colorOverride?: string;
}

export const WorkoutTypeIcon: React.FC<WorkoutTypeIconProps> = ({ 
  type, 
  className = '',
  size = 'md',
  colorOverride 
}) => {
  const getIconForType = () => {
    switch (type) {
      case 'strength':
        return <Dumbbell className={`${className} ${colorOverride || ''}`} />;
      case 'bodyweight':
        return '💪'; // Muscle emoji
      case 'cardio':
        return '🏃'; // Running emoji 
      case 'flexibility':
        return '🧘'; // Yoga/flexibility emoji
      case 'rest_day':
        return '😌'; 
      case 'custom':
        return '✨'; 
      case 'one_off':
        return '🎯'; 
      case 'hiit':
        return '⚡'; 
      case 'sport':
        return '🎾'; 
      case 'swimming':
        return '🏊'; 
      case 'cycling':
        return '🚴'; 
      case 'dance':
        return '💃'; 
      case 'basketball':
        return '🏀'; 
      case 'golf':
        return '⛳'; 
      case 'volleyball':
        return '🏐'; 
      case 'baseball':
        return '⚾'; 
      case 'tennis':
        return '🎾'; 
      case 'hiking':
        return '🥾'; 
      case 'skiing':
        return '⛷️'; 
      case 'yoga':
        return '🧘'; 
      default:
        return '📝'; 
    }
  };

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

  // For Dumbbell, we'll use its default rendering, for others we'll keep the existing style
  const renderIcon = () => {
    if (type === 'strength') {
      return getIconForType();
    }
    
    return (
      <span 
        className={`workout-type-icon ${className}`} 
        role="img" 
        aria-label={`${type} workout`}
        style={{ 
          fontSize: getFontSize(), 
          lineHeight: 1,
          color: colorOverride 
        }}
      >
        {getIconForType()}
      </span>
    );
  };

  return renderIcon();
};

// Update WORKOUT_TYPES to use Dumbbell for strength
export const WORKOUT_TYPES: {value: WorkoutType; label: string; icon: React.ReactNode}[] = [
  { value: 'strength', label: 'Strength', icon: <Dumbbell /> },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'hiit', label: 'HIIT', icon: '⚡' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'dance', label: 'Dance', icon: '💃' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'golf', label: 'Golf', icon: '⛳' },
  { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
  { value: 'skiing', label: 'Skiing', icon: '⛷️' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' }
];

