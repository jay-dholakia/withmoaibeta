
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PlusCircle, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';

const WorkoutHistoryTab = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  const { refetch } = useQuery({
    queryKey: ['client-workouts', user?.id, refreshKey],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('Fetching workout history for user:', user.id);
      try {
        const history = await fetchClientWorkoutHistory(user.id);
        console.log(`Fetched ${history.length} workout history items`);
        return history;
      } catch (err) {
        console.error('Error fetching workout history:', err);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  return (
    <div>
      <div className="mt-8 border-t pt-6">
        <Button asChild variant="outline" className="w-full mb-4 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
          <Link to="/client-dashboard/workouts/one-off">
            <PlusCircle className="h-4 w-4" />
            Enter Custom Workout
          </Link>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full mb-4 flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => {
            // This would be handled by parent component
          }}
        >
          <Armchair className="h-4 w-4" />
          Log Rest Day
        </Button>
      </div>
      
      <button 
        className="hidden" 
        onClick={() => {
          refetch(); 
          console.log('Refreshing workout history data');
        }}
        id="refresh-workout-history"
      />
    </div>
  );
};

export default WorkoutHistoryTab;
