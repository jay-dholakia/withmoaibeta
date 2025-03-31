
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createExercise } from '@/services/workout-service';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Exercise name must be at least 2 characters.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  description: z.string().optional(),
  exercise_type: z.string().default('strength'),
  log_type: z.string().default('weight_reps'),
});

type FormValues = z.infer<typeof formSchema>;

type CreateExerciseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExerciseCreated?: (exercise: any) => void;
};

const EXERCISE_CATEGORIES = [
  'Abs',
  'Back',
  'Biceps',
  'Cardio',
  'Chest',
  'Core',
  'Full Body',
  'Legs',
  'Shoulders',
  'Triceps',
  'Upper Body',
  'Lower Body',
  'Olympic',
  'Plyometrics',
  'Other'
];

const EXERCISE_TYPES = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'sport', label: 'Sport-Specific' }
];

const LOG_TYPES = [
  { value: 'weight_reps', label: 'Weight & Reps' },
  { value: 'time', label: 'Time' },
  { value: 'distance', label: 'Distance' },
  { value: 'bodyweight', label: 'Bodyweight Only' }
];

export const CreateExerciseForm = ({ 
  open, 
  onOpenChange, 
  onExerciseCreated 
}: CreateExerciseFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      exercise_type: 'strength',
      log_type: 'weight_reps'
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Fix: Make sure to pass the required properties
      const result = await createExercise({
        name: data.name,
        category: data.category,
        description: data.description,
        exercise_type: data.exercise_type,
        log_type: data.log_type
      });
      
      if (result.error) {
        toast.error('Failed to create exercise');
        console.error('Error creating exercise:', result.error);
        return;
      }
      
      if (result.isDuplicate) {
        toast.warning(`Exercise "${data.name}" already exists!`);
        if (onExerciseCreated && result.exercise) {
          onExerciseCreated(result.exercise);
        }
      } else if (result.exercise) {
        toast.success(`Exercise "${data.name}" created successfully!`);
        if (onExerciseCreated) {
          onExerciseCreated(result.exercise);
        }
        form.reset();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error submitting exercise:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Exercise</DialogTitle>
          <DialogDescription>
            Add a new exercise to the database. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exercise Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Bench Press" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXERCISE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Exercise description" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exercise_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXERCISE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="log_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logging Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How to log it" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOG_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Exercise'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
