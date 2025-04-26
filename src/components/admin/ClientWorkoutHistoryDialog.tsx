import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkoutHistoryItem, StandardWorkoutType } from '@/types/workout';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { deleteWorkoutCompletion } from '@/services/workout-delete-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutTypeIcon } from '@/components/client/WorkoutTypeIcon';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from "sonner";

interface ClientWorkoutHistoryDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientWorkoutHistoryDialog = ({ 
  clientId, 
  clientName,
  open, 
  onOpenChange 
}: ClientWorkoutHistoryDialogProps) => {
  const queryClient = useQueryClient();
  
  const { data: workoutHistory, isLoading } = useQuery({
    queryKey: ['client-workout-history', clientId],
    queryFn: () => fetchClientWorkoutHistory(clientId),
    enabled: open // Only fetch when dialog is open
  });

  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const getWorkoutType = (type: string | undefined): StandardWorkoutType => {
    const validTypes: StandardWorkoutType[] = [
      'strength', 'cardio', 'bodyweight', 'flexibility', 
      'rest_day', 'custom', 'one_off', 'hiit', 'sport',
      'swimming', 'cycling', 'dance', 'basketball', 'golf',
      'volleyball', 'baseball', 'tennis', 'hiking', 'skiing', 'yoga'
    ];
    
    return (type && validTypes.includes(type as StandardWorkoutType)) 
      ? type as StandardWorkoutType 
      : 'custom';
  };

  const handleDelete = async (workoutId: string) => {
    try {
      const success = await deleteWorkoutCompletion(workoutId);
      if (success) {
        toast.success("Workout deleted successfully");
        queryClient.invalidateQueries({
          queryKey: ['client-workout-history', clientId]
        });
      } else {
        toast.error("Failed to delete workout");
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
      toast.error("An error occurred while deleting the workout");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Workout History - {clientName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Workout</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {Array.from({ length: 5 }).map((_, cellIndex) => (
                      <TableCell key={`loading-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : workoutHistory && workoutHistory.length > 0 ? (
                workoutHistory.map((workout: WorkoutHistoryItem) => (
                  <TableRow key={workout.id}>
                    <TableCell>
                      {formatWorkoutDate(workout.completed_at)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {workout.rest_day ? (
                        "Rest Day"
                      ) : workout.life_happens_pass ? (
                        "Life Happens Pass"
                      ) : (
                        workout.workout?.title || "Custom Workout"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <WorkoutTypeIcon type={getWorkoutType(workout.workout?.workout_type)} />
                        <span className="capitalize">
                          {workout.workout?.workout_type || 'custom'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                        Completed
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(workout.id)}
                        title="Delete workout"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No workout history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
