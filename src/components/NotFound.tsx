
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <p className="mb-8 text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/client-dashboard/workouts">
          Return to Workouts
        </Link>
      </Button>
    </div>
  );
};
