
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats time into a readable string (hh:mm:ss)
 */
export function formatTime(hours: number, minutes: number, seconds: number): string {
  const paddedHours = hours.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');
  
  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
}
