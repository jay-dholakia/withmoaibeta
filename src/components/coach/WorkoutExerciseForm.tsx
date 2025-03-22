
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Exercise, WorkoutExercise } from '@/types/workout';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

// Function to check if an exercise is cardio (run/walk)
const isCardioExercise = (exerciseName: string): boolean => {
  const name = exerciseName.toLowerCase();
  return name.includes('run') || name.includes('walk');
};

// Define separate schemas for different exercise types
const cardioFormSchema = z.object({
  notes: z.string().optional()
});

const strengthFormSchema = z.object({
  sets: z.coerce.number().min(1, 'At least 1 set is required'),
  reps: z.string().min(1, 'Reps information is required'),
  rest_seconds: z.coerce.number().optional(),
  notes: z.string().optional()
});

// Type for cardio exercises
type CardioFormValues = z.infer<typeof cardioFormSchema>;
// Type for strength exercises
type StrengthFormValues = z.infer<typeof strengthFormSchema>;

interface WorkoutExerciseFormProps {
  exercise: Exercise;
  onSubmit: (values: CardioFormValues | StrengthFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  existingData?: Partial<WorkoutExercise>;
}

export const WorkoutExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData
}) => {
  const isCardio = isCardioExercise(exercise.name);
  
  // Conditionally use the appropriate form based on exercise type
  if (isCardio) {
    return (
      <CardioExerciseForm
        exercise={exercise}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        existingData={existingData}
      />
    );
  } else {
    return (
      <StrengthExerciseForm
        exercise={exercise}
        onSubmit={onSubmit}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        existingData={existingData}
      />
    );
  }
};

// Component for cardio exercises (run/walk)
const CardioExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData
}) => {
  const form = useForm<CardioFormValues>({
    resolver: zodResolver(cardioFormSchema),
    defaultValues: {
      notes: existingData?.notes || ''
    }
  });

  useEffect(() => {
    form.reset({
      notes: existingData?.notes || ''
    });
  }, [exercise, existingData, form]);

  const handleSubmit = (values: CardioFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">{exercise.category}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Enter distance, duration, or other details..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button 
              type="button" 
              disabled={isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting ? 'Saving...' : 'Save Exercise'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

// Component for strength exercises
const StrengthExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData
}) => {
  const form = useForm<StrengthFormValues>({
    resolver: zodResolver(strengthFormSchema),
    defaultValues: {
      sets: existingData?.sets || 3,
      reps: existingData?.reps || '10',
      rest_seconds: existingData?.rest_seconds || 60,
      notes: existingData?.notes || ''
    }
  });

  useEffect(() => {
    form.reset({
      sets: existingData?.sets || 3,
      reps: existingData?.reps || '10',
      rest_seconds: existingData?.rest_seconds || 60,
      notes: existingData?.notes || ''
    });
  }, [exercise, existingData, form]);

  const handleSubmit = (values: StrengthFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">{exercise.category}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="sets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sets</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reps</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 10 or 8-12" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rest_seconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rest (seconds)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      value={field.value || ''} 
                      min={0} 
                      step={15}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Optional instructions or notes about this exercise"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button 
              type="button" 
              disabled={isSubmitting}
              onClick={form.handleSubmit(handleSubmit)}
            >
              {isSubmitting ? 'Saving...' : 'Save Exercise'}
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};
