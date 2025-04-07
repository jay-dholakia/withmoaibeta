
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { WorkoutProgramForm } from '@/components/coach/WorkoutProgramForm';
import { fetchWorkoutProgram, updateWorkoutProgram } from '@/services/workout-service';
import { toast } from 'sonner';

const EditProgramPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) return;
      
      try {
        setIsLoading(true);
        const data = await fetchWorkoutProgram(programId);
        if (data) {
          setProgram(data);
        } else {
          toast.error('Program not found. It may have been deleted or you may not have permission to view it.');
          navigate('/coach-dashboard/workouts');
        }
      } catch (error) {
        console.error('Error fetching program:', error);
        toast.error('Failed to load program details');
        navigate('/coach-dashboard/workouts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgram();
  }, [programId, navigate]);

  const handleUpdateProgram = async (values: any) => {
    if (!programId) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedData = {
        title: values.title,
        description: values.description || null,
        weeks: values.weeks,
        program_type: values.programType || program.program_type // Preserve existing program type if not changed
      };
      
      await updateWorkoutProgram(programId, updatedData);
      
      toast.success('Workout program updated successfully');
      navigate(`/coach-dashboard/workouts/${programId}`);
    } catch (error) {
      console.error('Error updating workout program:', error);
      toast.error('Failed to update workout program');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={() => navigate(`/coach-dashboard/workouts/${programId}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Program
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Edit Program</h1>
        
        <div className="max-w-2xl mx-auto">
          {program && (
            <WorkoutProgramForm 
              onSubmit={handleUpdateProgram} 
              isSubmitting={isSubmitting} 
              initialData={program}
              mode="edit"
              onCancel={() => navigate(`/coach-dashboard/workouts/${programId}`)}
            />
          )}
        </div>
      </div>
    </CoachLayout>
  );
};

export default EditProgramPage;
