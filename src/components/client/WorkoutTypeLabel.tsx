
import React from 'react';
import { WorkoutType } from '@/types/workout';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Dumbbell, 
  Timer, 
  Activity 
} from 'lucide-react';

interface WorkoutTypeLabelProps {
  workoutType?: WorkoutType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

const WorkoutTypeLabel = ({
  workoutType = 'strength',
  size = 'md',
  showIcon = true,
  showLabel = true
}: WorkoutTypeLabelProps) => {
  
  const getTypeConfig = () => {
    switch (workoutType) {
      case 'cardio':
        return {
          icon: <Activity size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />,
          label: 'Cardio',
          color: 'bg-red-100 text-red-800 hover:bg-red-100'
        };
      case 'mobility':
        return {
          icon: <Timer size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />,
          label: 'Mobility',
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        };
      case 'flexibility':
        return {
          icon: <Heart size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />,
          label: 'Flexibility',
          color: 'bg-purple-100 text-purple-800 hover:bg-purple-100'
        };
      case 'strength':
      default:
        return {
          icon: <Dumbbell size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />,
          label: 'Strength',
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        };
    }
  };

  const config = getTypeConfig();
  
  return (
    <Badge 
      variant="outline" 
      className={`font-normal ${config.color} ${size === 'sm' ? 'text-xs py-0' : size === 'md' ? 'text-sm py-0.5' : 'text-sm py-1'}`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {showLabel && config.label}
    </Badge>
  );
};

export default WorkoutTypeLabel;
