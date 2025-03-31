import React, { useState, useEffect } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkoutsList } from '@/components/client/WorkoutsList';
import { WorkoutTypeIcon } from '@/components/client/WorkoutTypeIcon';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';
import { Calendar, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedWorkouts } from '@/services/assigned-workouts-service';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateCustomWorkout } from '@/components/client/CreateCustomWorkout';
import { CustomWorkoutsList } from '@/components/client/CustomWorkoutsList';
import { MonthlyCalendarView } from '@/components/client/MonthlyCalendarView';
import { EnterOneOffWorkout } from '@/components/client/EnterOneOffWorkout';

const WorkoutsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('weekly');
  const [weekTab, setWeekTab] = useState('1');
  const [isCreateCustomWorkoutOpen, setIsCreateCustomWorkoutOpen] = useState(false);
  const [isEnterOneOffWorkoutOpen, setIsEnterOneOffWorkoutOpen] = useState(false);

  const { data: assignedWorkouts, isLoading, error } = useQuery(
    ['assignedWorkouts', user?.id],
    () => fetchAssignedWorkouts(user?.id || ''),
    {
      enabled: !!user?.id, // Only run the query if the user is logged in
    }
  );

  useEffect(() => {
    if (error) {
      toast.error('Failed to load assigned workouts');
    }
  }, [error]);
  
  return (
    <ClientLayout>
      <div className="flex flex-col px-4 pt-2 pb-16 md:pt-4">
        <div className="flex flex-col mb-6">
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Track your assigned and custom workouts.</p>
        </div>
        
        <Tabs defaultValue="weekly" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weekly" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Assigned Workouts</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading workouts...</p>
                ) : assignedWorkouts ? (
                  <WorkoutsList workouts={assignedWorkouts} />
                ) : (
                  <p>No workouts assigned yet.</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Week Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <WeekProgressSection />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="monthly" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Monthly Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyCalendarView />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-medium">Custom Workouts</CardTitle>
                  <CardDescription>Create and track your own workouts</CardDescription>
                </div>
                <Dialog open={isCreateCustomWorkoutOpen} onOpenChange={setIsCreateCustomWorkoutOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Create
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Create Custom Workout</DialogTitle>
                      <DialogDescription>
                        Design your own workout with custom exercises and tracking options.
                      </DialogDescription>
                    </DialogHeader>
                    <CreateCustomWorkout 
                      onCreated={() => {
                        setIsCreateCustomWorkoutOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="pt-2">
                <CustomWorkoutsList />
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg font-medium">One-off Workout</CardTitle>
                    <CardDescription>Quickly log a workout you've completed</CardDescription>
                  </div>
                  <Dialog open={isEnterOneOffWorkoutOpen} onOpenChange={setIsEnterOneOffWorkoutOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 gap-1">
                        <Plus className="h-3.5 w-3.5" />
                        Log Workout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Log One-off Workout</DialogTitle>
                        <DialogDescription>
                          Record a workout you've completed outside of your regular program.
                        </DialogDescription>
                      </DialogHeader>
                      <EnterOneOffWorkout 
                        onWorkoutLogged={() => {
                          setIsEnterOneOffWorkoutOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">
                    Use this to quickly log workouts that aren't part of your regular program.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
};

export default WorkoutsPage;
