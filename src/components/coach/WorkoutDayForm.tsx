import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateWorkoutExercise } from '@/services/workout-service';
import { toast } from 'sonner';

interface WorkoutDayFormProps {
  workoutId: string;
  title: string;
  description: string;
  workout_type: "strength" | "cardio" | "flexibility" | "mobility";
  onUpdate: () => void;
}

export const WorkoutDayForm: React.FC<WorkoutDayFormProps> = ({ workoutId, title, description, workout_type, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: title,
    description: description,
    workout_type: workout_type,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({
      title: title,
      description: description,
      workout_type: workout_type,
    });
  }, [title, description, workout_type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSelectChange = (value: "strength" | "cardio" | "flexibility" | "mobility") => {
    setFormData(prevData => ({
      ...prevData,
      workout_type: value
    }));
  };

  const handleUpdate = async (workoutId: string) => {
    setIsSaving(true);
    try {
      const result = await updateWorkoutExercise(workoutId, {
        title: formData.title,
        description: formData.description,
        workout_type: formData.workout_type
      });
      
      if (result) {
        toast.success('Workout updated successfully');
        onUpdate();
      } else {
        toast.error('Failed to update workout');
      }
    } catch (error) {
      console.error('Error updating workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label>Workout Type</Label>
        <Select onValueChange={handleSelectChange} defaultValue={formData.workout_type}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strength">Strength</SelectItem>
            <SelectItem value="cardio">Cardio</SelectItem>
            <SelectItem value="flexibility">Flexibility</SelectItem>
            <SelectItem value="mobility">Mobility</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        onClick={() => handleUpdate(workoutId)}
        disabled={isSaving}
      >
        {isSaving ? 'Saving...' : 'Update Workout'}
      </button>
    </div>
  );
};
