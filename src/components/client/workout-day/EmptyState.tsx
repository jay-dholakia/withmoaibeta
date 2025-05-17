
import React from 'react';
import { format } from 'date-fns';

interface EmptyStateProps {
  date: Date;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ date }) => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">No workout history found for {format(date, 'MMMM d, yyyy')}</p>
    </div>
  );
};
