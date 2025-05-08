
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WORKOUT_TYPES } from '../WorkoutTypeIcon';

interface WorkoutEditFormProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  duration: number | null;
  setDuration: (duration: number | null) => void;
  workoutType: string;
  setWorkoutType: (type: string) => void;
}

export const WorkoutEditForm: React.FC<WorkoutEditFormProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  duration,
  setDuration,
  workoutType,
  setWorkoutType,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <div>
          <Label htmlFor="title">Workout Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter workout title"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="workout-type">Workout Type</Label>
          <Select
            value={workoutType}
            onValueChange={setWorkoutType}
          >
            <SelectTrigger id="workout-type" className="mt-1">
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
        
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={duration || ''}
            onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : null)}
            placeholder="Enter duration in minutes"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter workout description"
            className="mt-1"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};
