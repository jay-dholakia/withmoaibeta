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

// Function to determine exercise type
const getExerciseType = (exercise: Exercise): string => {
  return exercise.exercise_type || 'strength';
};

// Define separate schemas for different exercise types
const cardioFormSchema = z.object({
  distance: z.string()
    .optional()
    .refine(val => !val || /^[0-9]+(\.[0-9]+)?$/.test(val), {
      message: "Distance must be a number (in miles)"
    }),
  duration: z.string()
    .optional()
    .refine(val => !val || /^([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9]$/.test(val), {
      message: "Duration must be in format HH:MM:SS or MM:SS"
    }),
  location: z.enum(['indoor', 'outdoor']).optional(),
  notes: z.string().optional()
});

const strengthFormSchema = z.object({
  sets: z.coerce.number().min(1, 'At least 1 set is required'),
  reps: z.string().min(1, 'Reps information is required'),
  rest_seconds: z.coerce.number().optional(),
  notes: z.string().optional()
});

const bodyweightFormSchema = z.object({
  sets: z.coerce.number().min(1, 'At least 1 set is required'),
  reps: z.string().min(1, 'Reps information is required'),
  notes: z.string().optional()
});

const flexibilityFormSchema = z.object({
  duration: z.string().optional(),
  notes: z.string().optional()
});

// Type for cardio exercises
type CardioFormValues = z.infer<typeof cardioFormSchema>;
// Type for strength exercises
type StrengthFormValues = z.infer<typeof strengthFormSchema>;
// Type for bodyweight exercises
type BodyweightFormValues = z.infer<typeof bodyweightFormSchema>;
// Type for flexibility exercises
type FlexibilityFormValues = z.infer<typeof flexibilityFormSchema>;

interface WorkoutExerciseFormProps {
  exercise: Exercise;
  onSubmit: (values: CardioFormValues | StrengthFormValues | BodyweightFormValues | FlexibilityFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  existingData?: Partial<WorkoutExercise>;
  autoSave?: boolean;
}

export const WorkoutExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData,
  autoSave = false
}) => {
  const exerciseType = getExerciseType(exercise);
  
  switch (exerciseType) {
    case 'cardio':
      return (
        <CardioExerciseForm
          exercise={exercise}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          existingData={existingData}
          autoSave={autoSave}
        />
      );
    case 'bodyweight':
      return (
        <BodyweightExerciseForm
          exercise={exercise}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          existingData={existingData}
          autoSave={autoSave}
        />
      );
    case 'flexibility':
      return (
        <FlexibilityExerciseForm
          exercise={exercise}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          existingData={existingData}
          autoSave={autoSave}
        />
      );
    default:
      return (
        <StrengthExerciseForm
          exercise={exercise}
          onSubmit={onSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          existingData={existingData}
          autoSave={autoSave}
        />
      );
  }
};

// Component for cardio exercises
const CardioExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData,
  autoSave
}) => {
  const extractDistance = (notes?: string | null): string => {
    if (!notes) return '';
    const match = notes.match(/Distance: ([0-9]+(\.[0-9]+)?)\s*miles/i);
    return match ? match[1] : '';
  };

  const extractDuration = (notes?: string | null): string => {
    if (!notes) return '';
    const match = notes.match(/Duration: (([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9])/i);
    return match ? match[1] : '';
  };

  const form = useForm<CardioFormValues>({
    resolver: zodResolver(cardioFormSchema),
    defaultValues: {
      distance: existingData?.notes ? extractDistance(existingData.notes) : '',
      duration: existingData?.notes ? extractDuration(existingData.notes) : '',
      location: (existingData?.notes?.includes('Location: indoor') ? 'indoor' : 
               existingData?.notes?.includes('Location: outdoor') ? 'outdoor' : undefined) as any,
      notes: existingData?.notes?.replace(/Distance: [^,]+, ?|Duration: [^,]+, ?|Location: (indoor|outdoor), ?/g, '') || ''
    }
  });

  useEffect(() => {
    form.reset({
      distance: existingData?.notes ? extractDistance(existingData.notes) : '',
      duration: existingData?.notes ? extractDuration(existingData.notes) : '',
      location: (existingData?.notes?.includes('Location: indoor') ? 'indoor' : 
               existingData?.notes?.includes('Location: outdoor') ? 'outdoor' : undefined) as any,
      notes: existingData?.notes?.replace(/Distance: [^,]+, ?|Duration: [^,]+, ?|Location: (indoor|outdoor), ?/g, '') || ''
    });
  }, [exercise, existingData, form]);

  useEffect(() => {
    if (autoSave && form.formState.isDirty) {
      const subscription = form.watch(() => {
        form.handleSubmit((data) => {
          const formattedData = { ...data };
          let formattedNotes = '';
          
          if (data.distance) formattedNotes += `Distance: ${data.distance} miles, `;
          if (data.duration) formattedNotes += `Duration: ${data.duration}, `;
          if (data.location) formattedNotes += `Location: ${data.location}, `;
          if (data.notes) formattedNotes += data.notes;
          
          formattedNotes = formattedNotes.replace(/, $/, '');
          
          onSubmit({ ...formattedData, notes: formattedNotes });
        })();
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, onSubmit, autoSave]);

  const handleSubmit = (values: CardioFormValues) => {
    let formattedNotes = '';
    
    if (values.distance) formattedNotes += `Distance: ${values.distance} miles, `;
    if (values.duration) formattedNotes += `Duration: ${values.duration}, `;
    if (values.location) formattedNotes += `Location: ${values.location}, `;
    if (values.notes) formattedNotes += values.notes;
    
    formattedNotes = formattedNotes.replace(/, $/, '');
    
    onSubmit({ ...values, notes: formattedNotes });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">
            {exercise.category} <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Cardio</span>
          </p>
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
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="distance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance (miles)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter distance in miles only" 
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (HH:MM:SS)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="00:30:00" 
                      pattern="^([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9]$"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">Format: HH:MM:SS or MM:SS</p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="indoor"
                      value="indoor"
                      checked={field.value === 'indoor'}
                      onChange={() => field.onChange('indoor')}
                      className="mr-2"
                    />
                    <label htmlFor="indoor">Indoor</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="outdoor"
                      value="outdoor"
                      checked={field.value === 'outdoor'}
                      onChange={() => field.onChange('outdoor')}
                      className="mr-2"
                    />
                    <label htmlFor="outdoor">Outdoor</label>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Any additional instructions or notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!autoSave && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {isSubmitting ? 'Saving...' : 'Save Exercise'}
              </Button>
            </div>
          )}
        </div>
      </Form>
    </div>
  );
};

// Component for flexibility exercises
const FlexibilityExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData,
  autoSave
}) => {
  const extractDuration = (notes?: string | null): string => {
    if (!notes) return '';
    const match = notes.match(/Duration: (([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9])/i);
    return match ? match[1] : '';
  };

  const form = useForm<FlexibilityFormValues>({
    resolver: zodResolver(flexibilityFormSchema),
    defaultValues: {
      duration: existingData?.notes ? extractDuration(existingData.notes) : '',
      notes: existingData?.notes?.replace(/Duration: [^,]+, ?/g, '') || ''
    }
  });

  useEffect(() => {
    form.reset({
      duration: existingData?.notes ? extractDuration(existingData.notes) : '',
      notes: existingData?.notes?.replace(/Duration: [^,]+, ?/g, '') || ''
    });
  }, [exercise, existingData, form]);

  useEffect(() => {
    if (autoSave && form.formState.isDirty) {
      const subscription = form.watch(() => {
        form.handleSubmit((data) => {
          const formattedData = { ...data };
          let formattedNotes = '';
          
          if (data.duration) formattedNotes += `Duration: ${data.duration}, `;
          if (data.notes) formattedNotes += data.notes;
          
          formattedNotes = formattedNotes.replace(/, $/, '');
          
          onSubmit({ ...formattedData, notes: formattedNotes });
        })();
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, onSubmit, autoSave]);

  const handleSubmit = (values: FlexibilityFormValues) => {
    let formattedNotes = '';
    
    if (values.duration) formattedNotes += `Duration: ${values.duration}, `;
    if (values.notes) formattedNotes += values.notes;
    
    formattedNotes = formattedNotes.replace(/, $/, '');
    
    onSubmit({ ...values, notes: formattedNotes });
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">
            {exercise.category} <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">Flexibility</span>
          </p>
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
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (HH:MM:SS)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="00:01:30" 
                    pattern="^([0-9]{1,2}:)?[0-5][0-9]:[0-5][0-9]$"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground mt-1">Format: HH:MM:SS or MM:SS</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions/Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ''} 
                    placeholder="Instructions on how to perform this stretch or mobility exercise"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!autoSave && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {isSubmitting ? 'Saving...' : 'Save Exercise'}
              </Button>
            </div>
          )}
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
  existingData,
  autoSave
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

  useEffect(() => {
    if (autoSave && form.formState.isDirty) {
      const subscription = form.watch(() => {
        const values = form.getValues();
        if (values.sets && values.reps) {
          form.handleSubmit((data) => {
            onSubmit(data);
          })();
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, onSubmit, autoSave]);

  const handleSubmit = (values: StrengthFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">
            {exercise.category} <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">Strength</span>
          </p>
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

          {!autoSave && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {isSubmitting ? 'Saving...' : 'Save Exercise'}
              </Button>
            </div>
          )}
        </div>
      </Form>
    </div>
  );
};

// Component for bodyweight exercises
const BodyweightExerciseForm: React.FC<WorkoutExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  isSubmitting,
  existingData,
  autoSave
}) => {
  const form = useForm<BodyweightFormValues>({
    resolver: zodResolver(bodyweightFormSchema),
    defaultValues: {
      sets: existingData?.sets || 3,
      reps: existingData?.reps || '10',
      notes: existingData?.notes || ''
    }
  });

  useEffect(() => {
    form.reset({
      sets: existingData?.sets || 3,
      reps: existingData?.reps || '10',
      notes: existingData?.notes || ''
    });
  }, [exercise, existingData, form]);

  useEffect(() => {
    if (autoSave && form.formState.isDirty) {
      const subscription = form.watch(() => {
        const values = form.getValues();
        if (values.sets && values.reps) {
          form.handleSubmit((data) => {
            onSubmit(data);
          })();
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, onSubmit, autoSave]);

  const handleSubmit = (values: BodyweightFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="border rounded-lg p-4 mb-4 bg-muted/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-medium">{exercise.name}</h4>
          <p className="text-sm text-muted-foreground">
            {exercise.category} <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Bodyweight</span>
          </p>
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
          <div className="grid grid-cols-2 gap-4">
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

          {!autoSave && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                disabled={isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {isSubmitting ? 'Saving...' : 'Save Exercise'}
              </Button>
            </div>
          )}
        </div>
      </Form>
    </div>
  );
};
