
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Run, Dumbbell, Armchair } from 'lucide-react';

interface LogActivityButtonsProps {
  onActivityLogged?: () => void;
}

export const LogActivityButtons: React.FC<LogActivityButtonsProps> = () => {
  return (
    <div className="space-y-3">
      <Button asChild variant="outline" className="w-full flex items-center justify-between text-blue-600 border-blue-200 hover:bg-blue-50">
        <Link to="/client-dashboard/workouts/log-run">
          <div className="flex items-center">
            <Run className="h-4 w-4 mr-2" />
            <span>Log Run</span>
          </div>
        </Link>
      </Button>
      
      <Button asChild variant="outline" className="w-full flex items-center justify-between text-purple-600 border-purple-200 hover:bg-purple-50">
        <Link to="/client-dashboard/workouts/log-cardio">
          <div className="flex items-center">
            <Dumbbell className="h-4 w-4 mr-2" />
            <span>Log Cardio</span>
          </div>
        </Link>
      </Button>
      
      <Button asChild variant="outline" className="w-full flex items-center justify-between text-amber-600 border-amber-200 hover:bg-amber-50">
        <Link to="/client-dashboard/workouts/log-rest">
          <div className="flex items-center">
            <Armchair className="h-4 w-4 mr-2" />
            <span>Log Rest Day</span>
          </div>
        </Link>
      </Button>
    </div>
  );
};
