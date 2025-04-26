
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkoutHistoryItem, StandardWorkoutType } from '@/types/workout';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkoutTypeIcon } from '@/components/client/WorkoutTypeIcon';

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
  const { data: workoutHistory, isLoading } = useQuery({
    queryKey: ['client-workout-history', clientId],
    queryFn: () => fetchClientWorkoutHistory(clientId),
    enabled: open // Only fetch when dialog is open
  });

  const formatWorkoutDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Function to safely get workout type as StandardWorkoutType
  const getWorkoutType = (type: string | undefined): StandardWorkoutType => {
    // Define a list of valid workout types matching StandardWorkoutType
    const validTypes: StandardWorkoutType[] = [
      'strength', 'cardio', 'bodyweight', 'flexibility', 
      'rest_day', 'custom', 'one_off', 'hiit', 'sport',
      'swimming', 'cycling', 'dance', 'basketball', 'golf',
      'volleyball', 'baseball', 'tennis', 'hiking', 'skiing', 'yoga'
    ];
    
    // If the type is valid, return it; otherwise default to 'custom'
    return (type && validTypes.includes(type as StandardWorkoutType)) 
      ? type as StandardWorkoutType 
      : 'custom';
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {Array.from({ length: 4 }).map((_, cellIndex) => (
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
