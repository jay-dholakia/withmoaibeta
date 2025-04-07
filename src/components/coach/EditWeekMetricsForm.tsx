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
    target_strength_workouts?: number;
    target_strength_mobility_workouts?: number;
  };
  programType: 'strength' | 'run';
  onSuccess: () => void;
}

const EditWeekMetricsForm: React.FC<EditWeekMetricsFormProps> = ({
  weekId,
  initialData,
  programType,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Define the schema for form validation with string inputs that transform to numbers
  const formSchema = z.object({
    target_miles_run: z.string()
      .optional()
      .transform(val => val ? Number(val) : undefined),
    target_cardio_minutes: z.string()
      .optional()
      .transform(val => val ? Number(val) : undefined),
    target_strength_workouts: z.string()
      .optional()
      .transform(val => val ? Number(val) : undefined),
    target_strength_mobility_workouts: z.string()
      .optional()
      .transform(val => val ? Number(val) : undefined),
  });

  // Define the form values type based on the schema
  type FormValues = z.infer<typeof formSchema>;

  // Initialize the form with empty string values (removing defaults)
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_miles_run: initialData.target_miles_run !== undefined ? initialData.target_miles_run.toString() : '',
      target_cardio_minutes: initialData.target_cardio_minutes !== undefined ? initialData.target_cardio_minutes.toString() : '',
      target_strength_workouts: initialData.target_strength_workouts !== undefined ? initialData.target_strength_workouts.toString() : '',
      target_strength_mobility_workouts: initialData.target_strength_mobility_workouts !== undefined ? initialData.target_strength_mobility_workouts.toString() : '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // The values are automatically transformed to numbers by the schema
      const updatedData = {
        target_miles_run: values.target_miles_run,
        target_cardio_minutes: values.target_cardio_minutes,
        target_strength_workouts: values.target_strength_workouts,
        target_strength_mobility_workouts: values.target_strength_mobility_workouts,
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
          <>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="target_strength_mobility_workouts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Strength/Mobility Workouts</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter number of workouts" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
        
        {programType === 'strength' && (
          <>
            <FormField
              control={form.control}
              name="target_strength_workouts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Strength Workouts</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter number of workouts" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="target_strength_mobility_workouts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Mobility Workouts</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter number of workouts" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
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
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
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
