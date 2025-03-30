
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChevronDown, 
  ChevronRight, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Dumbbell
} from 'lucide-react';
import { toast } from "sonner";
import { WorkoutExerciseForm } from './WorkoutExerciseForm';

interface SupersetGroupProps {
  groupId: string;
  title: string;
  exercises: any[];
  onDeleteGroup: (groupId: string) => Promise<void>;
  onUpdateExercise: (exerciseId: string, data: any) => Promise<void>;
  onRemoveExercise: (exerciseId: string) => Promise<void>;
  onMoveExerciseUp: (exerciseId: string) => Promise<void>;
  onMoveExerciseDown: (exerciseId: string) => Promise<void>;
  isSubmitting: boolean;
}

const SupersetGroup: React.FC<SupersetGroupProps> = ({
  groupId,
  title,
  exercises,
  onDeleteGroup,
  onUpdateExercise,
  onRemoveExercise,
  onMoveExerciseUp,
  onMoveExerciseDown,
  isSubmitting
}) => {
  const [expanded, setExpanded] = useState(true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  
  // Sort exercises by superset_order
  const sortedExercises = [...exercises].sort((a, b) => 
    (a.superset_order ?? 0) - (b.superset_order ?? 0)
  );

  // Flag the last exercise in the superset for rest display
  const enhancedExercises = sortedExercises.map((exercise, index) => ({
    ...exercise,
    is_last_in_superset: index === sortedExercises.length - 1
  }));

  const handleDeleteGroup = async () => {
    try {
      await onDeleteGroup(groupId);
      setConfirmingDelete(false);
      toast.success('Superset deleted successfully');
    } catch (error) {
      console.error('Error deleting superset:', error);
      toast.error('Failed to delete superset');
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-base flex items-center">
              <Dumbbell className="h-4 w-4 mr-1.5 text-blue-600" />
              {title || 'Superset'}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({exercises.length} exercises)
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center">
            <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete superset</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete superset</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this superset? The exercises will remain but no longer be grouped.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteGroup}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 mt-2">
            {enhancedExercises.map((exercise, index) => (
              <Card key={exercise.id} className="bg-background">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      {index + 1}. {exercise.exercise?.name || 'Exercise'}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onMoveExerciseUp(exercise.id)}
                        disabled={index === 0 || isSubmitting}
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onMoveExerciseDown(exercise.id)}
                        disabled={index === enhancedExercises.length - 1 || isSubmitting}
                      >
                        <ArrowDown className="h-4 w-4" />
                        <span className="sr-only">Move down</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onRemoveExercise(exercise.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove from superset</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <WorkoutExerciseForm
                    initialData={exercise}
                    onSubmit={(data) => onUpdateExercise(exercise.id, data)}
                    isSubmitting={isSubmitting}
                    isSupersetMember={true}
                    supersetOrder={exercise.superset_order}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SupersetGroup;
