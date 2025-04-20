
import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Youtube, ArrowRightLeft, Info } from 'lucide-react';
import { WorkoutExercise, PersonalRecord } from '@/types/workout';

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
        {exercise.exercise?.youtube_link && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onVideoClick(exercise.exercise!.youtube_link!, exercise.exercise!.name)}
          >
            <Youtube className="h-4 w-4 mr-1" /> Demo
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onSwapClick(exercise)}
        >
          <ArrowRightLeft className="h-4 w-4 mr-1" /> Swap
        </Button>
      </div>
    </div>
  );
};
