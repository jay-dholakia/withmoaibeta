
import { format, addDays, addWeeks } from 'date-fns';

/**
 * Calculates the current week number based on a program start date
 */
export const getCurrentWeekNumber = (startDate: string | Date): number => {
  const start = new Date(startDate);
  const today = new Date();
  
  // Calculate the difference in days
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate week number (0-indexed, then add 1)
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  return weekNumber;
};

/**
 * Gets the start and end dates for a specific week number based on program start date
 */
export const getWeekDateRange = (startDate: string | Date, weekNumber: number): { start: Date; end: Date } => {
  const programStart = new Date(startDate);
  
  // Calculate the start date of the specified week (weekNumber is 1-indexed)
  const weekStart = addDays(addWeeks(programStart, weekNumber - 1), 0);
  
  // Calculate the end date (6 days after the start date)
  const weekEnd = addDays(weekStart, 6);
  
  return { start: weekStart, end: weekEnd };
};

/**
 * Formats a week date range for display
 */
export const formatWeekDateRange = (startDate: string | Date, weekNumber: number): string => {
  const { start, end } = getWeekDateRange(startDate, weekNumber);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
};
