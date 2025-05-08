
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WorkoutType } from '../WorkoutTypeIcon';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKOUT_TYPES } from '../WorkoutTypeIcon';

interface WorkoutFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  duration: number | undefined;
  setDuration: (value: number | undefined) => void;
  workoutType: WorkoutType;
  setWorkoutType: (value: WorkoutType) => void;
}

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  duration,
  setDuration,
  workoutType,
  setWorkoutType
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Workout Title *</Label>
          <Input 
            id="title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="My Custom Workout"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input 
            id="duration" 
            type="number" 
            min="1"
            value={duration || ''} 
            onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)} 
            placeholder="60"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="workout-type">Workout Type *</Label>
        <Select 
          value={workoutType} 
          onValueChange={(value) => setWorkoutType(value as WorkoutType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select workout type" />
          </SelectTrigger>
          <SelectContent>
            {WORKOUT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Describe your workout..."
          rows={3}
        />
      </div>
    </>
  );
};
