
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { PlusCircle } from 'lucide-react';
import { fetchWorkoutPrograms, deleteWorkoutProgram } from '@/services/workout-service';
import { WorkoutProgram } from '@/types/workout';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WorkoutProgramsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteProgram = async () => {
    if (!deleteProgramId) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkoutProgram(deleteProgramId);
      
      // Update programs list
      if (user?.id) {
        const updatedPrograms = await fetchWorkoutPrograms(user.id);
        setPrograms(updatedPrograms);
      }
      
      toast.success('Workout program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete workout program');
    } finally {
      setIsDeleting(false);
      setDeleteProgramId(null);
    }
  };

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

        <WorkoutProgramList 
          programs={programs} 
          isLoading={isLoading} 
          onDeleteProgram={setDeleteProgramId} 
        />

        {/* Delete program confirmation */}
        <AlertDialog 
          open={deleteProgramId !== null}
          onOpenChange={(open) => !open && setDeleteProgramId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout Program</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout program and all its contents? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProgram}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramsPage;
