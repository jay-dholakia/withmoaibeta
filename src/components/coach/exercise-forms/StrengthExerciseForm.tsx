
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StrengthExerciseFormProps {
  sets: number;
  setSets: (sets: number) => void;
  reps: string;
  setReps: (reps: string) => void;
  restSeconds: number;
  setRestSeconds: (restSeconds: number) => void;
}

export const StrengthExerciseForm: React.FC<StrengthExerciseFormProps> = ({
  sets,
  setSets,
  reps,
  setReps,
  restSeconds,
  setRestSeconds
}) => {
  const handleSetsChange = (value: string) => {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setSets(numericValue);
    } else if (value === '') {
      setSets(1); // Default to 1 if empty
    }
  };

  const handleRepsChange = (value: string) => {
    // Allow any reps format including numbers or text with "s" for seconds
    setReps(value);
  };

  const handleRestChange = (value: string) => {
    const numericValue = parseInt(value);
    if (!isNaN(numericValue) && numericValue >= 0) {
      setRestSeconds(numericValue);
    } else if (value === '') {
      setRestSeconds(0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sets" className="text-center block mb-2">Sets</Label>
        <Input
          id="sets"
          type="number"
          value={sets}
          onChange={(e) => handleSetsChange(e.target.value)}
          min={1}
          className="w-full text-center"
        />
      </div>
      
      {/* Column headers and inputs with switched order (reps first, weight second) */}
      <div>
        <div className="grid grid-cols-2 gap-4 mb-1">
          <div className="text-center text-sm text-muted-foreground">Reps</div>
          <div className="text-center text-sm text-muted-foreground">Weight</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              id="reps"
              value={reps}
              onChange={(e) => handleRepsChange(e.target.value)}
              placeholder="e.g., 10 or 30s"
              className="w-full text-center min-w-0 px-2"
              type="text"
              inputMode="numeric"
            />
          </div>
          <div>
            <Input
              disabled
              placeholder="Client will enter"
              className="w-full text-center bg-muted/30 min-w-0 px-2"
            />
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        For strength exercises, use just numbers (e.g., "10") to auto-populate client tracking
      </p>
      
      <div>
        <Label htmlFor="rest" className="text-center block">Rest (seconds)</Label>
        <Input
          id="rest"
          type="number"
          value={restSeconds}
          onChange={(e) => handleRestChange(e.target.value)}
          min={0}
          className="w-full text-center"
        />
      </div>
    </div>
  );
};
