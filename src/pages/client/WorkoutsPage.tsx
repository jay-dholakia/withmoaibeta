
import React, { useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageTransition } from '@/components/PageTransition';
import WorkoutsList from '@/components/client/WorkoutsList';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { WorkoutDayDetails } from '@/components/client/WorkoutDayDetails';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutsList from '@/components/client/CustomWorkoutsList';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';

// Create a wrapper component for WorkoutDayDetails to provide required props
const WorkoutDayDetailsWrapper = () => {
  const { date } = useParams<{ date: string }>();
  // Convert the URL parameter to a Date object
  const dateObj = date ? new Date(date) : new Date();
  
  // Since we don't have workouts data here, we'll pass an empty array
  // The actual component can fetch workouts based on the date
  return <WorkoutDayDetails date={dateObj} workouts={[]} />;
};

const WorkoutsPage = () => {
  const [calendarView, setCalendarView] = useState(false);
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/client-login" />;
  }

  return (
    <PageTransition>
      <Routes>
        <Route 
          index 
          element={
            calendarView ? (
              <MonthlyCalendarView 
                workouts={[]} // Pass empty array as we're not using it directly here
                onDaySelect={() => {}} // Add empty function to satisfy type requirements
              />
            ) : (
              <WorkoutsList />
            )
          } 
        />
        <Route path="day/:date" element={<WorkoutDayDetailsWrapper />} />
        <Route path="active/:workoutId" element={<ActiveWorkout />} />
        <Route path="complete/:workoutCompletionId" element={<WorkoutComplete />} />
        <Route path="custom/new" element={<CreateCustomWorkout />} />
        <Route path="custom" element={<CustomWorkoutsList />} />
        <Route path="custom/:customWorkoutId" element={<CustomWorkoutDetail />} />
      </Routes>
    </PageTransition>
  );
};

export default WorkoutsPage;
