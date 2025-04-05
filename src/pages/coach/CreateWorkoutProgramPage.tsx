
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutProgramForm } from '@/components/coach/WorkoutProgramForm';
import { createWorkoutProgram } from '@/services/workout-service';
import { toast } from 'sonner';

const CreateWorkoutProgramPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      navigate(`/coach-dashboard/workouts/${createdProgram.id}`);
    } catch (error) {
      console.error('Error creating workout program:', error);
      toast.error('Failed to create workout program');
    } finally {
      setIsSubmitting(false);
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
        
        <div className="max-w-2xl mx-auto">
          <WorkoutProgramForm 
            onSubmit={handleCreateProgram} 
            isSubmitting={isSubmitting} 
          />
        </div>
      </div>
    </CoachLayout>
  );
};

export default CreateWorkoutProgramPage;
