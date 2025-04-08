
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { updateWorkoutWeek } from '@/services/workout-service';

interface EditWeekMetricsFormProps {
  weekId: string;
  initialData: {
    target_miles_run?: number;
    target_cardio_minutes?: number;
    target_strength_mobility_workouts?: number;
  };
  programType: 'strength' | 'run';
  onSuccess: () => void;
}

// Define schemas for both program types
const runProgramSchema = z.object({
  target_miles_run: z.number().min(0, "Target miles must be a positive number"),
  target_cardio_minutes: z.number().min(0, "Target cardio minutes must be a positive number")
});

const strengthProgramSchema = z.object({
  target_cardio_minutes: z.number().min(0, "Target cardio minutes must be a positive number")
});

// Define types based on schemas
type RunFormValues = z.infer<typeof runProgramSchema>;
type StrengthFormValues = z.infer<typeof strengthProgramSchema>;

const EditWeekMetricsForm: React.FC<EditWeekMetricsFormProps> = ({
  weekId,
  initialData,
  programType,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the correct form based on program type
  const form = useForm<RunFormValues | StrengthFormValues>({
    resolver: zodResolver(programType === 'run' ? runProgramSchema : strengthProgramSchema),
    defaultValues: programType === 'run' 
      ? {
          target_miles_run: initialData.target_miles_run ?? 0,
          target_cardio_minutes: initialData.target_cardio_minutes ?? 0
        } 
      : {
          target_cardio_minutes: initialData.target_cardio_minutes ?? 0
        }
  });

  const onSubmit = async (values: RunFormValues | StrengthFormValues) => {
    try {
      setIsSubmitting(true);

      // Only include relevant fields based on program type
      const updatedData = programType === 'run' 
        ? {
            target_miles_run: (values as RunFormValues).target_miles_run,
            target_cardio_minutes: (values as RunFormValues).target_cardio_minutes,
            // We don't include target_strength_mobility_workouts as it's auto-calculated
          }
        : {
            // For strength programs, only include cardio minutes
            target_cardio_minutes: (values as StrengthFormValues).target_cardio_minutes,
          };

      console.log('Updating week metrics:', weekId, updatedData);
      
      await updateWorkoutWeek(weekId, updatedData);
      toast.success('Weekly metrics updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating metrics:', error);
      toast.error('Failed to update metrics');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {programType === 'run' && (
          <FormField
            control={form.control}
            name="target_miles_run"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Miles</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter target miles" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="target_cardio_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Cardio Minutes</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter target minutes" 
                  {...field}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Information about auto-calculated metrics */}
        <div className="text-sm text-muted-foreground">
          {programType === 'run' ? (
            <p>Strength/mobility workouts will be automatically calculated based on assigned workouts.</p>
          ) : (
            <p>Strength workouts will be automatically calculated based on assigned workouts.</p>
          )}
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Metrics'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export { EditWeekMetricsForm };
