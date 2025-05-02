import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from 'sonner';
import { updateWorkoutExercise } from '@/services/workout-service';

interface StandaloneWorkoutFormProps {
  initialData?: {
    title: string;
    description: string;
    workout_type: string;
    category: string;
  };
  onSubmit: (data: {
    title: string;
    description: string;
    workout_type: string;
    category: string;
  }) => void;
  onCancel: () => void;
}

const StandaloneWorkoutForm: React.FC<StandaloneWorkoutFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    workout_type: "strength" | "cardio" | "flexibility" | "mobility";
    category: string;
  }>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    workout_type: (initialData?.workout_type as "strength" | "cardio" | "flexibility" | "mobility") || 'strength',
    category: initialData?.category || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Details</CardTitle>
        <CardDescription>Enter the workout details below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
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
            <Label htmlFor="workout_type">Workout Type</Label>
            <Select 
              value={formData.workout_type} 
              onValueChange={(value: "strength" | "cardio" | "flexibility" | "mobility") => 
                setFormData({...formData, workout_type: value})
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select workout type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strength">Strength</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="flexibility">Flexibility</SelectItem>
                <SelectItem value="mobility">Mobility</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StandaloneWorkoutForm;
