
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

const formSchema = z.object({
  title: z.string().min(2, 'Week title must be at least 2 characters'),
  description: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutWeekFormProps {
  weekNumber: number;
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const WorkoutWeekForm: React.FC<WorkoutWeekFormProps> = ({ 
  weekNumber, 
  onSubmit, 
  isSubmitting,
  onCancel
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `Week ${weekNumber}`,
      description: ''
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
            {isSubmitting ? 'Saving...' : 'Save Week'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
