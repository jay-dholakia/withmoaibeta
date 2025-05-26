
import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface WorkoutHeaderProps {
  title: string;
  workoutType?: string;
  workoutId: string;
  completedAt: string;
  isDeleting: boolean;
  isUpdatingDate: boolean;
  onDelete: (workoutId: string) => Promise<void>;
  onUpdateDate: (workoutId: string, newDate: Date) => Promise<void>;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  title,
  workoutType,
  workoutId,
  completedAt,
  isDeleting,
  isUpdatingDate,
  onDelete,
  onUpdateDate
}) => {
  return (
    <div className="flex justify-between items-center">
      <div className="text-base font-medium">
        {title || 'Workout'}
      </div>
      <div className="flex items-center gap-2">
        {workoutType && (
          <Badge variant="outline">{workoutType}</Badge>
        )}
        
        {/* Date picker popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-muted gap-1"
              disabled={isUpdatingDate}
            >
              <Calendar className="h-4 w-4 mr-1" />
              <span className="sr-only">Change date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={new Date(completedAt)}
              onSelect={(newDate) => {
                if (newDate) onUpdateDate(workoutId, newDate);
              }}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete workout</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this workout? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(workoutId)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
