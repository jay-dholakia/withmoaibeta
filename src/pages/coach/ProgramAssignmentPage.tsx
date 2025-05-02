
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkoutProgram } from '@/services/workout-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { assignProgramToUser } from '@/services/workout-service';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramAssignmentForm } from '@/components/coach/ProgramAssignmentForm';

const ProgramAssignmentPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => fetchWorkoutProgram(programId!),
    enabled: !!programId,
  });

  const handleAssignProgram = async (userId: string, startDate: Date) => {
    if (!programId || !userId || !startDate || !user) {
      toast.error('Missing required information for program assignment');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignProgramToUser({
        program_id: programId,
        user_id: userId,
        assigned_by: user.id,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: null
      });
      
      toast.success(`Program assigned successfully`);
      navigate(`/coach-dashboard/workouts/${programId}`);
    } catch (error) {
      console.error('Error assigning program:', error);
      toast.error('Failed to assign program');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-8">
        <p>Program not found</p>
        <Button 
          variant="link" 
          onClick={() => navigate('/coach-dashboard/workouts')}
          className="mt-2"
        >
          Back to Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate(`/coach-dashboard/workouts/${programId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Program
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Assign Program</CardTitle>
          <CardDescription>
            Assign "{program.title}" to a client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramAssignmentForm 
            programId={programId!}
            onAssign={handleAssignProgram}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramAssignmentPage;
