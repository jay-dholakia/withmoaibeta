
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { PlusCircle } from 'lucide-react';
import { fetchWorkoutPrograms } from '@/services/workout-service';
import { WorkoutProgram } from '@/types/workout';
import { toast } from 'sonner';

const WorkoutProgramsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPrograms = async () => {
      if (!user?.id) return;
      
      try {
        const data = await fetchWorkoutPrograms(user.id);
        setPrograms(data);
      } catch (error) {
        console.error('Error loading workout programs:', error);
        toast.error('Failed to load workout programs');
      } finally {
        setIsLoading(false);
      }
    };

    loadPrograms();
  }, [user?.id]);

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Workout Programs</h1>
          <Button onClick={() => navigate('/coach-dashboard/workouts/new')} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Program
          </Button>
        </div>

        <WorkoutProgramList programs={programs} isLoading={isLoading} />
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramsPage;
