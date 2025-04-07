
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutProgramForm } from '@/components/coach/WorkoutProgramForm';
import { createWorkoutProgram } from '@/services/workout-service';
import { toast } from 'sonner';
import ProgramWeeklyMetricsForm from '@/components/coach/ProgramWeeklyMetricsForm';
import { Card, CardContent } from '@/components/ui/card';

const CreateProgramPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programCreated, setProgramCreated] = useState(false);
  const [programData, setProgramData] = useState<{
    id: string;
    title: string;
    description: string | null;
    weeks: number;
    programType: 'Moai Run' | 'Moai Strength';
  } | null>(null);

  const handleCreateProgram = async (values: any) => {
    if (!user?.id) {
      toast.error('You must be logged in to create a program');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const programData = {
        title: values.title,
        description: values.description || null,
        weeks: values.weeks,
        coach_id: user.id
      };
      
      const createdProgram = await createWorkoutProgram(programData);
      
      toast.success('Workout program created successfully');
      setProgramCreated(true);
      setProgramData({
        id: createdProgram.id,
        title: createdProgram.title,
        description: createdProgram.description,
        weeks: createdProgram.weeks,
        programType: 'Moai Strength' // Default, could be configurable in future
      });
    } catch (error) {
      console.error('Error creating workout program:', error);
      toast.error('Failed to create workout program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (programData) {
      navigate(`/coach-dashboard/workouts/${programData.id}`);
    }
  };

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={() => navigate('/coach-dashboard/workouts')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Programs
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Create Workout Program</h1>
        
        <div className="max-w-3xl mx-auto">
          {!programCreated ? (
            <Card>
              <CardContent className="pt-6">
                <WorkoutProgramForm 
                  onSubmit={handleCreateProgram} 
                  isSubmitting={isSubmitting} 
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <h3 className="font-medium text-green-800">Program Created Successfully</h3>
                <p className="text-green-700 mt-1">
                  Your program "{programData?.title}" has been created. Now you can set weekly metrics and add workouts.
                </p>
              </div>
              
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <ProgramWeeklyMetricsForm
                    programId={programData?.id || ''}
                    programType={programData?.programType || 'Moai Strength'}
                    weeks={programData?.weeks || 0}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={handleFinish}>
                  Continue to Program Details
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </CoachLayout>
  );
};

export default CreateProgramPage;
