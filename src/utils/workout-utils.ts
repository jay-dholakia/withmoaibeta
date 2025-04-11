
import { WorkoutType } from '../types/workout';

export const getWorkoutTypeLabel = (type: WorkoutType): string => {
  switch (type) {
    case 'strength':
      return 'Strength';
    case 'cardio':
      return 'Cardio';
    case 'hiit':
      return 'HIIT';
    case 'mobility':
      return 'Mobility';
    case 'yoga':
      return 'Yoga';
    case 'running':
      return 'Running';
    case 'rest':
      return 'Rest';
    case 'custom':
      return 'Custom';
    default:
      return 'Workout';
  }
};

export const formatWorkoutDateTime = (date?: Date | null): string => {
  if (!date) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const estimateWorkoutEndTime = (startTime: Date, durationMinutes: number = 60): Date => {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + durationMinutes);
  return endTime;
};
