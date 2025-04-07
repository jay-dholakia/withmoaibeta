
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { WorkoutWeekForm } from '@/components/coach/WorkoutWeekForm';
import { createWorkoutWeek } from '@/services/workout-service';
import { toast } from 'sonner';

const CreateWorkoutWeekPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get the week number from location state
  const weekNumber = location.state?.weekNumber;
  
  useEffect(() => {
    if (!programId || !weekNumber) {
      toast.error('Missing required information');
      navigate(`/coach-dashboard/workouts/${programId || ''}`);
    }
  }, [programId, weekNumber, navigate]);

  const handleSubmitWeek = async (values: { title: string; description?: string }) => {
    if (!programId || !weekNumber) {
      toast.error('Missing required information');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const weekData = {
        program_id: programId,
        week_number: weekNumber,
        title: values.title,
        description: values.description || null
      };
      
      const result = await createWorkoutWeek(weekData);
      toast.success('Week created successfully');
      navigate(`/coach-dashboard/workouts/week/${result.id}`);
    } catch (error) {
      console.error('Failed to create week:', error);
      toast.error('Failed to create week');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/coach-dashboard/workouts/${programId}`);
  };

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
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-xl">Create Week {weekNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutWeekForm
              weekNumber={weekNumber || 1}
              onSubmit={handleSubmitWeek}
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
              mode="create"
            />
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default CreateWorkoutWeekPage;
