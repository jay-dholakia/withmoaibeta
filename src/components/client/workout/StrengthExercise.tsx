
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Youtube, ArrowRightLeft, Info } from 'lucide-react';
import { WorkoutExercise, PersonalRecord, Exercise } from '@/types/workout';
import { fetchSimilarExercises } from '@/services/exercise-service';
import { useQuery } from '@tanstack/react-query';
import { saveWorkoutDraft, updateExerciseIdInDraft } from '@/services/workout-draft-service';
import VideoDialog from './VideoDialog';
import SwapExerciseDialog from './SwapExerciseDialog';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

interface Props {
  exercise: WorkoutExercise;
  exerciseState: any;
  personalRecord?: PersonalRecord;
  onSetChange: (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onSetCompletion: (exerciseId: string, setIndex: number, completed: boolean) => void;
  onVideoClick: (url: string, name: string) => void;
  onSwapClick: (exercise: WorkoutExercise) => void;
}

export const StrengthExercise: React.FC<Props> = ({
  exercise,
  exerciseState,
  personalRecord,
  onSetChange,
  onSetCompletion,
  onVideoClick,
  onSwapClick
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const { workoutCompletionId } = useParams<{ workoutCompletionId: string }>();
  const [currentExercise, setCurrentExercise] = useState<Exercise | undefined>(exercise.exercise);

  // Query for similar exercises
  const { data: similarExercises, isLoading } = useQuery({
    queryKey: ['similar-exercises', currentExercise?.id],
    queryFn: () => fetchSimilarExercises(currentExercise?.id || ''),
    enabled: !!currentExercise?.id,
  });

  const handleSwapExercise = async (newExercise: Exercise) => {
    try {
      // Update the local state first for immediate UI feedback
      setCurrentExercise(newExercise);
      
      // Update the exercise in the state through the parent component
      onSwapClick({
        ...exercise,
        exercise: newExercise,
      });

      // Update the exercise ID in the workout draft
      if (workoutCompletionId) {
        await updateExerciseIdInDraft(workoutCompletionId, exercise.id, newExercise.id);
        console.log('Exercise swap persisted to draft:', {
          workoutId: workoutCompletionId,
          originalExerciseId: exercise.id,
          newExerciseId: newExercise.id
        });
      }

      toast.success(`Swapped to ${newExercise.name}`);
    } catch (error) {
      console.error('Error swapping exercise:', error);
      toast.error('Failed to swap exercise');
      // Revert the local state on error
      setCurrentExercise(exercise.exercise);
    }
  };

  return (
    <div className="space-y-3">
      {personalRecord && (
        <div className="bg-gray-50 p-2 rounded-md text-xs flex items-center mb-2">
          <Info className="h-4 w-4 mr-1.5 text-blue-500" />
          <span>
            <span className="font-semibold">PR:</span> {personalRecord.weight} lbs x {personalRecord.reps || 1} {personalRecord.reps !== 1 ? 'reps' : 'rep'}
          </span>
        </div>
      )}

      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-500">
            <th className="text-left font-normal">Set</th>
            <th className="text-left font-normal">Reps</th>
            <th className="text-left font-normal">Weight</th>
            <th className="text-center font-normal w-12">Done</th>
          </tr>
        </thead>
        <tbody>
          {exerciseState.sets.map((set: any, index: number) => (
            <tr key={`${exercise.id}-set-${index}`} className="h-10">
              <td className="pl-1 w-8 text-sm">{set.setNumber}</td>
              <td className="pr-1 w-24">
                <Input
                  type="number"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) => onSetChange(exercise.id, index, 'reps', e.target.value)}
                  className="h-8 text-sm"
                />
              </td>
              <td className="pr-1 w-24">
                <Input
                  type="number"
                  placeholder="lbs"
                  value={set.weight}
                  onChange={(e) => onSetChange(exercise.id, index, 'weight', e.target.value)}
                  className="h-8 text-sm"
                />
              </td>
              <td className="text-center">
                <Checkbox 
                  id={`set-${exercise.id}-${index}`}
                  checked={set.completed}
                  onCheckedChange={(checked) => onSetCompletion(exercise.id, index, checked === true)}
                  className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="flex justify-end mt-2 space-x-2">
        {currentExercise?.youtube_link && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsVideoOpen(true)}
          >
            <Youtube className="h-4 w-4 mr-1" /> Demo
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm"
          disabled={isLoading}
          onClick={() => setIsSwapDialogOpen(true)}
        >
          <ArrowRightLeft className="h-4 w-4 mr-1" /> 
          {isLoading ? 'Loading...' : 'Swap'}
        </Button>
      </div>

      {currentExercise?.youtube_link && (
        <VideoDialog 
          isOpen={isVideoOpen}
          onClose={() => setIsVideoOpen(false)}
          videoUrl={currentExercise.youtube_link}
          exerciseName={currentExercise.name || 'Exercise'}
        />
      )}
      
      <SwapExerciseDialog
        isOpen={isSwapDialogOpen}
        onClose={() => setIsSwapDialogOpen(false)}
        exerciseName={currentExercise?.name || 'Exercise'}
        muscleGroup={currentExercise?.muscle_group || ''}
        similarExercises={similarExercises}
        isLoading={isLoading}
        onSwapSelect={handleSwapExercise}
      />
    </div>
  );
};

