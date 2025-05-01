
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackgroundFetchIndicatorProps {
  isLoading: boolean;
  className?: string;
  size?: number;
}

export const BackgroundFetchIndicator = ({ 
  isLoading, 
  className, 
  size = 4 
}: BackgroundFetchIndicatorProps) => {
  if (!isLoading) return null;
  
  return (
    <Loader2 
      className={cn(
        `h-${size} w-${size} animate-spin text-client dark:text-blue-300 ml-2`,
        className
      )} 
    />
  );
};
