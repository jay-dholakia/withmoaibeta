
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { PlusCircle } from 'lucide-react';
import { fetchWorkoutPrograms, deleteWorkoutProgram } from '@/services/workout-service';
import { WorkoutProgram } from '@/types/workout';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['workout-programs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await fetchWorkoutPrograms(user.id, true);
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });

  const handleDeleteProgram = async () => {
    if (!deleteProgramId) return;
    
    try {
      setIsDeleting(true);
      await deleteWorkoutProgram(deleteProgramId);
      
      // Invalidate and refetch programs
      queryClient.invalidateQueries({ queryKey: ['workout-programs', user?.id] });
      
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
      <div className="w-full px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-left">Workout Programs</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/coach-dashboard/workouts/create')} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Program
            </Button>
          </div>
        </div>

        <WorkoutProgramList 
          programs={programs} 
          isLoading={isLoading} 
          onDeleteProgram={setDeleteProgramId} 
        />

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
