
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { Card, CardContent } from '@/components/ui/card';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutHistoryItem } from '@/types/workout';

// Helper function to process life happens passes
const processWorkoutHistory = (workouts: WorkoutHistoryItem[]): WorkoutHistoryItem[] => {
  return workouts.map(workout => {
    // If this is a life happens pass, make sure the title is correct
    if (workout.life_happens_pass === true || workout.workout_type === 'life_happens') {
      return {
        ...workout,
        title: "Life Happens Pass",
        description: "Workout credit used via Life Happens Pass",
        workout_type: "life_happens"
      };
    }
    return workout;
  });
};

const ClientWorkoutDetailsPage: React.FC = () => {
  const { user } = useAuth();
  const { workoutId } = useParams<{ workoutId: string }>();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workouts, setWorkouts] = useState<WorkoutHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const workoutHistory = await fetchClientWorkoutHistory(user.id);
        // Process workouts to ensure life happens passes are displayed correctly
        setWorkouts(processWorkoutHistory(workoutHistory));
      } catch (error) {
        console.error('Error fetching workout history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [user?.id]);

  return (
    <ClientLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Workout Details</h1>
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading workout details...</p>
            </CardContent>
          </Card>
        ) : (
          <WorkoutDayDetails 
            date={selectedDate} 
            workouts={workouts} 
          />
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientWorkoutDetailsPage;
