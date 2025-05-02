import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { fetchWorkoutPrograms } from '@/services/program-service';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const CoachDashboard: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const programsData = await fetchWorkoutPrograms();
      setPrograms(programsData);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CoachLayout>
      <div className="container mx-auto p-4">
        <Tabs defaultValue="programs" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="programs">Workout Programs</TabsTrigger>
            {/* <TabsTrigger value="templates">Workout Templates</TabsTrigger> */}
          </TabsList>
          <TabsContent value="programs" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => navigate('/coach-dashboard/workouts/create')}>
                Create Program
              </Button>
            </div>
            {isLoading ? (
              <Card className="flex justify-center items-center p-6">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading programs...
              </Card>
            ) : (
              <WorkoutProgramList programs={programs} />
            )}
          </TabsContent>
          {/* <TabsContent value="templates">
            Templates Content
          </TabsContent> */}
        </Tabs>
      </div>
    </CoachLayout>
  );
};

export default CoachDashboard;
