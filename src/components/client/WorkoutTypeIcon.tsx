
import React from 'react';
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
        return '🏋️‍♀️'; // iOS dumbbell emoji
      case 'bodyweight':
        return '💪'; // Muscle emoji
      case 'cardio':
        return '🏃'; // Running emoji 
      case 'running':
        return '🏃‍♂️'; // Running emoji with male gender
      case 'live_run':
        return '🏃‍♂️'; // Same runner emoji for live runs
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
        return '16px'; // Increased from 14px
      case 'lg':
        return '26px'; // Increased from 22px
      case 'md':
      default:
        return '22px'; // Increased from 18px
    }
  };

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
          color: colorOverride || '#0EA5E9', // Default to a bright blue if no color override
          textShadow: '0 0 1px rgba(0,0,0,0.1)', // Subtle text shadow for better visibility
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {getIconForType()}
      </span>
    );
  };

  return renderIcon();
};

export const WORKOUT_TYPES: {value: WorkoutType; label: string; icon: React.ReactNode}[] = [
  { value: 'strength', label: 'Strength', icon: '🏋️‍♀️' },
  { value: 'bodyweight', label: 'Bodyweight', icon: '💪' },
  { value: 'flexibility', label: 'Flexibility', icon: '🧘' },
  { value: 'hiit', label: 'HIIT', icon: '⚡' },
  { value: 'swimming', label: 'Swimming', icon: '🏊' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'running', label: 'Running', icon: '🏃‍♂️' },
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
