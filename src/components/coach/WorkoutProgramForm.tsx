
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(3, 'Program title must be at least 3 characters'),
  description: z.string().optional(),
  weeks: z.coerce.number().min(1, 'Program must have at least 1 week').max(52, 'Program cannot exceed 52 weeks')
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutProgramFormProps {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
}

export const WorkoutProgramForm: React.FC<WorkoutProgramFormProps> = ({ onSubmit, isSubmitting }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      weeks: 4
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
              <FormLabel>Program Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 12-Week Strength Program" {...field} />
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
              <FormLabel>Program Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the goals and focus of this program" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weeks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Weeks</FormLabel>
              <FormControl>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select the program duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        {week} {week === 1 ? 'week' : 'weeks'}
                      </SelectItem>
                    ))}
                    <SelectItem value="16">16 weeks</SelectItem>
                    <SelectItem value="20">20 weeks</SelectItem>
                    <SelectItem value="24">24 weeks</SelectItem>
                    <SelectItem value="52">52 weeks</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Program'}
        </Button>
      </form>
    </Form>
  );
};
