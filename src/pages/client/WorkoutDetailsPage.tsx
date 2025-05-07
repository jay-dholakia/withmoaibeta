
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import { Card, CardContent } from '@/components/ui/card';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { fetchPersonalRecords, fetchExercisePersonalRecord } from '@/services/client-service';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutHistoryItem, PersonalRecord } from '@/types/workout';

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
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching workout history for user:", user.id);
        const workoutHistory = await fetchClientWorkoutHistory(user.id);
        console.log("Fetched workouts:", workoutHistory);
        
        // Process workouts to ensure life happens passes are displayed correctly
        const processedWorkouts = processWorkoutHistory(workoutHistory);
        setWorkouts(processedWorkouts);

        // Fetch personal records for the user
        console.log("Fetching personal records for user:", user.id);
        const records = await fetchPersonalRecords(user.id);
        console.log("Fetched personal records:", records);
        setPersonalRecords(records);
        
        // Log the structure of the first personal record to help with debugging
        if (records && records.length > 0) {
          console.log("Sample personal record structure:", JSON.stringify(records[0], null, 2));
        }
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
            personalRecords={personalRecords} 
          />
        )}
      </div>
    </ClientLayout>
  );
};

export default ClientWorkoutDetailsPage;
