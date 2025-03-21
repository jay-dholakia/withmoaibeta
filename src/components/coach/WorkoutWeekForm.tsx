
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { WorkoutWeek } from '@/types/workout';

// Update the schema to clearly mark title as required
const formSchema = z.object({
  title: z.string().min(2, 'Week title must be at least 2 characters'),
  description: z.string().optional()
});

// Explicitly type the form values to match the schema
type FormValues = {
  title: string; // Note: no ? here to ensure title is required
  description?: string;
};

interface WorkoutWeekFormProps {
  weekNumber: number;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  initialData?: WorkoutWeek;
  mode?: 'create' | 'edit';
}

export const WorkoutWeekForm: React.FC<WorkoutWeekFormProps> = ({ 
  weekNumber, 
  onSubmit, 
  isSubmitting,
  onCancel,
  initialData,
  mode = 'create'
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || `Week ${weekNumber}`,
      description: initialData?.description || ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Week Title</FormLabel>
              <FormControl>
                <Input placeholder={`Week ${weekNumber}`} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Week Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the focus or theme of this week" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Save Week' : 'Update Week'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
