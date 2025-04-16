
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export const LogActivityButtons: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-3 mb-4">
      <Button 
        asChild
        variant="outline" 
        className="flex items-center justify-between text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Link to="/client-dashboard/workouts/log-run">
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Run</span>
          </div>
          <span className="ml-auto">🏃</span>
        </Link>
      </Button>
      
      <Button 
        asChild
        variant="outline"
        className="flex items-center justify-between text-purple-600 border-purple-200 hover:bg-purple-50"
      >
        <Link to="/client-dashboard/workouts/log-cardio">
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Cardio Cross Training</span>
          </div>
          <span className="ml-auto">🚴</span>
        </Link>
      </Button>
      
      <Button 
        asChild
        variant="outline"
        className="flex items-center justify-between text-amber-600 border-amber-200 hover:bg-amber-50"
      >
        <Link to="/client-dashboard/workouts/log-rest">
          <div className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span>Log Rest Day</span>
          </div>
          <span className="ml-auto">😴</span>
        </Link>
      </Button>
    </div>
  );
};
