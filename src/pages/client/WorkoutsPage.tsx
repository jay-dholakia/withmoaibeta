
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
import { Plus } from 'lucide-react';
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
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="assigned">Assigned Workouts</TabsTrigger>
                  <TabsTrigger value="history">Workout History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assigned" className="mt-0">
                  {/* Weekly Progress Card - moved inside the assigned tab */}
                  <RunGoalsProgressCard />
                  
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
              <div className="space-y-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex items-center justify-between w-full rounded-full border py-3 px-4 text-blue-500"
                >
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="text-base font-medium">Run</span>
                  </div>
                  <span className="text-xl">🏃</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-between w-full rounded-full border py-3 px-4 text-purple-500"
                >
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="text-base font-medium">Strength/Mobility Workout</span>
                  </div>
                  <span className="text-xl">🏋️</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-between w-full rounded-full border py-3 px-4 text-red-500"
                >
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="text-base font-medium">Cross Training Cardio</span>
                  </div>
                  <span className="text-xl">🚴</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center justify-between w-full rounded-full border py-3 px-4 text-green-500"
                >
                  <div className="flex items-center">
                    <Plus className="h-5 w-5 mr-2" />
                    <span className="text-base font-medium">Rest Day</span>
                  </div>
                  <span className="text-xl">😌</span>
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
