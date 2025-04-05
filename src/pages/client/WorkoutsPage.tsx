
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
import RunGoalsProgressCard from '@/components/client/RunGoalsProgressCard';
import WorkoutHistoryTab from '@/components/client/WorkoutHistoryTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import PassCounter from '@/components/client/PassCounter';
import { Button } from '@/components/ui/button';
import { Dumbbell, Calendar, History, Running, Bike, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [activeTab, setActiveTab] = useState("assigned");
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
            <div className="space-y-6 pb-20">
              {/* Weekly Progress Card */}
              <RunGoalsProgressCard />
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="assigned">Assigned Workouts</TabsTrigger>
                  <TabsTrigger value="history">Workout History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assigned" className="mt-0">
                  {calendarView ? (
                    <MonthlyCalendarView 
                      workouts={[]} 
                      onDaySelect={() => {}} 
                    />
                  ) : (
                    <WorkoutsList />
                  )}
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <WorkoutHistoryTab />
                </TabsContent>
              </Tabs>
              
              {/* Workout Action Buttons */}
              <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 grid grid-cols-5 gap-2 z-10">
                <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 px-1">
                  <PlusCircle className="h-4 w-4 mb-1" />
                  <span className="text-xs">Rest Day</span>
                </Button>
                
                <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 px-1">
                  <Running className="h-4 w-4 mb-1" />
                  <span className="text-xs">Log Run</span>
                </Button>
                
                <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 px-1">
                  <Dumbbell className="h-4 w-4 mb-1" />
                  <span className="text-xs">Strength</span>
                </Button>
                
                <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 px-1">
                  <Bike className="h-4 w-4 mb-1" />
                  <span className="text-xs">Cardio</span>
                </Button>
                
                <Button variant="outline" size="sm" className="flex flex-col h-auto py-2 px-1">
                  <Calendar className="h-4 w-4 mb-1" />
                  <span className="text-xs">Custom</span>
                </Button>
              </div>
            </div>
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
