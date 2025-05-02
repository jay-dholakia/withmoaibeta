
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { toast } from "sonner";
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { fetchWorkoutPrograms, deleteWorkoutProgram } from '@/services/program-service';
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

const WorkoutProgramsPage: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
      toast.error('Failed to load workout programs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      await deleteWorkoutProgram(deleteId);
      setPrograms(prev => prev.filter(p => p.id !== deleteId));
      toast.success('Program deleted successfully');
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
    } finally {
      setDeleteId(null);
      setIsDeleting(false);
    }
  };

  return (
    <CoachLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Workout Programs</h1>
          <Button onClick={() => navigate('/coach-dashboard/workouts/create')}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create Program
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading workout programs...</div>
        ) : (
          <WorkoutProgramList programs={programs} onDelete={handleDelete} />
        )}

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the workout program and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
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
