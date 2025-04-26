
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';

export const LogActivityButtons: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-3 mb-4">
      <Button 
        asChild
        variant="outline" 
        className="flex items-center justify-between text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-lg"
      >
        <Link to="/client-dashboard/workouts/log-run">
          <div className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            <span>Log Run</span>
          </div>
          <span className="ml-auto">🏃</span>
        </Link>
      </Button>
      
      <Button 
        asChild
        variant="outline"
        className="flex items-center justify-between text-green-600 dark:text-green-400 border-green-200 dark:border-green-900 hover:bg-green-50 dark:hover:bg-green-900/30 shadow-lg"
      >
        <Link to="/client-dashboard/workouts/live-run">
          <div className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
            <span>Start Live Run</span>
          </div>
          <span className="ml-auto">📍</span>
        </Link>
      </Button>
      
      <Button 
        asChild
        variant="outline"
        className="flex items-center justify-between text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-lg"
      >
        <Link to="/client-dashboard/workouts/log-cardio">
          <div className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
            <span>Log Cardio Cross Training</span>
          </div>
          <span className="ml-auto">🚴</span>
        </Link>
      </Button>
      
      <Button 
        asChild
        variant="outline"
        className="flex items-center justify-between text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-900/30 shadow-lg"
      >
        <Link to="/client-dashboard/workouts/log-rest">
          <div className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
            <span>Log Rest Day</span>
          </div>
          <span className="ml-auto">😴</span>
        </Link>
      </Button>
    </div>
  );
};

export default LogActivityButtons;
