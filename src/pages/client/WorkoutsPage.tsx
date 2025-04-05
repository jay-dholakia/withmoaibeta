
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/PageTransition';
import WorkoutsList from '@/components/client/WorkoutsList';
import MonthlyCalendarView from '@/components/client/MonthlyCalendarView';
import WorkoutDayDetails from '@/components/client/WorkoutDayDetails';
import WorkoutComplete from '@/components/client/WorkoutComplete';
import ActiveWorkout from '@/components/client/ActiveWorkout';
import CreateCustomWorkout from '@/components/client/CreateCustomWorkout';
import CustomWorkoutsList from '@/components/client/CustomWorkoutsList';
import CustomWorkoutDetail from '@/components/client/CustomWorkoutDetail';

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
              <MonthlyCalendarView onViewToggle={() => setCalendarView(false)} />
            ) : (
              <WorkoutsList onViewToggle={() => setCalendarView(true)} />
            )
          } 
        />
        <Route path="day/:date" element={<WorkoutDayDetails />} />
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
