
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchRunGoals,
  fetchWeeklyRunProgress,
} from '@/services/run-service';
import { RunGoals, WeeklyRunProgress } from '@/types/workout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Run as RunningIcon, Dumbbell, Heart } from 'lucide-react';
import GoalProgressCard from './GoalProgressCard';
import RunActivityForm from './RunActivityForm';
import CardioActivityForm from './CardioActivityForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MoaiRunDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<RunGoals | null>(null);
  const [progress, setProgress] = useState<WeeklyRunProgress | null>(null);
  const [activeTab, setActiveTab] = useState('progress');

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [goalsData, progressData] = await Promise.all([
        fetchRunGoals(user.id),
        fetchWeeklyRunProgress(user.id)
      ]);
      
      setGoals(goalsData);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading run dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleLogSuccess = () => {
    loadData();
  };

  if (!user) {
    return <div>Please log in to view your dashboard</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GoalProgressCard goals={goals} progress={progress} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="run" className="flex items-center gap-2">
            <RunningIcon className="h-4 w-4" />
            <span>Log Run</span>
          </TabsTrigger>
          <TabsTrigger value="workout" className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4" />
            <span>Workouts</span>
          </TabsTrigger>
          <TabsTrigger value="cardio" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span>Log Cardio</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="run" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Your Run</CardTitle>
              <CardDescription>
                Record your running activity to track progress toward your weekly mileage goal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RunActivityForm onSuccess={handleLogSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="workout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strength Workouts</CardTitle>
              <CardDescription>
                Complete strength workouts to track progress toward your weekly exercise goal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="mb-4">Access your assigned and custom workouts to build strength.</p>
                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <a href="/client-dashboard/workouts">View Workouts</a>
                  </Button>
                  <Button asChild>
                    <a href="/client-dashboard/workouts/one-off">Log Custom Workout</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cardio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log Cross-Training Cardio</CardTitle>
              <CardDescription>
                Record your cardio activities to track progress toward your weekly cardio minutes goal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardioActivityForm onSuccess={handleLogSuccess} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoaiRunDashboard;
