
import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Info } from 'lucide-react';
import { WorkoutExercise, PersonalRecord } from '@/types/workout';
import { ExerciseState } from '@/types/active-workout';

interface StrengthExerciseProps {
  workoutExerciseId: string;
  exerciseState: ExerciseState;
  onSetChange: (setNumber: number, field: 'weight' | 'reps', value: string) => void;
  onToggleComplete: (setNumber: number) => void;
  workoutExercise: WorkoutExercise;
}

export const StrengthExercise: React.FC<StrengthExerciseProps> = ({
  workoutExerciseId,
  exerciseState,
  onSetChange,
  onToggleComplete,
  workoutExercise
}) => {
  return (
    <div className="space-y-3">
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
          {exerciseState.sets.map((set, index) => (
            <tr key={`${workoutExerciseId}-set-${index}`} className="h-10">
              <td className="pl-1 w-8 text-sm">{set.setNumber}</td>
              <td className="pr-1 w-24">
                <Input
                  type="text"
                  placeholder="reps"
                  value={set.reps}
                  onChange={(e) => onSetChange(set.setNumber, 'reps', e.target.value)}
                  className="h-8 text-sm"
                />
              </td>
              <td className="pr-1 w-24">
                <Input
                  type="text"
                  placeholder="lbs"
                  value={set.weight}
                  onChange={(e) => onSetChange(set.setNumber, 'weight', e.target.value)}
                  className="h-8 text-sm"
                />
              </td>
              <td className="text-center">
                <Checkbox 
                  id={`set-${workoutExerciseId}-${index}`}
                  checked={set.completed}
                  onCheckedChange={() => onToggleComplete(set.setNumber)}
                  className="h-6 w-6 rounded-full border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
