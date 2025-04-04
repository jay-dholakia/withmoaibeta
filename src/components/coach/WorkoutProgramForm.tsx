
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
  FormMessage,
  FormDescription
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
import { WorkoutProgram } from '@/types/workout';

const formSchema = z.object({
  title: z.string().min(3, 'Program title must be at least 3 characters'),
  description: z.string().optional(),
  weeks: z.coerce.number().min(1, 'Program must have at least 1 week').max(52, 'Program cannot exceed 52 weeks'),
  programType: z.enum(['strength', 'run']).default('strength')
});

type FormValues = z.infer<typeof formSchema>;

interface WorkoutProgramFormProps {
  onSubmit: (values: FormValues) => void;
  isSubmitting: boolean;
  initialData?: Partial<WorkoutProgram>;
  mode?: 'create' | 'edit';
  onCancel?: () => void;
}

export const WorkoutProgramForm: React.FC<WorkoutProgramFormProps> = ({ 
  onSubmit, 
  isSubmitting,
  initialData,
  mode = 'create',
  onCancel
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      weeks: initialData?.weeks || 4,
      programType: (initialData as any)?.programType || 'strength'
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
          name="programType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Program Type</FormLabel>
              <Select 
                value={field.value}
                onValueChange={(value) => field.onChange(value as "strength" | "run")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="strength">Moai Strength</SelectItem>
                  <SelectItem value="run">Moai Run</SelectItem>
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
              {mode === 'edit' && (
                <FormDescription>
                  Note: Changing the number of weeks won't delete existing content,
                  but may require adjustment of your program structure.
                </FormDescription>
              )}
              <FormControl>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={mode === 'edit'} // Disable changing weeks in edit mode
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

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (mode === 'create' ? 'Creating...' : 'Saving...') 
              : (mode === 'create' ? 'Create Program' : 'Save Changes')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
