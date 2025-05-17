
import React from 'react';

interface SpecialWorkoutContentProps {
  isLifeHappensPass?: boolean;
  isRestDay?: boolean;
}

export const SpecialWorkoutContent: React.FC<SpecialWorkoutContentProps> = ({
  isLifeHappensPass,
  isRestDay
}) => {
  if (isLifeHappensPass) {
    return <div className="bg-muted p-3 rounded text-sm">Life Happens Pass Used</div>;
  }
  
  if (isRestDay) {
    return <div className="bg-muted p-3 rounded text-sm">Rest Day</div>;
  }
  
  return null;
};
