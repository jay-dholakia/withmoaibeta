
import React, { useState, useEffect } from 'react';
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

const strengthFormSchema = z.object({
  title: z.string().min(3, 'Program title must be at least 3 characters'),
  description: z.string().optional(),
  weeks: z.coerce.number().min(1, 'Program must have at least 1 week').max(52, 'Program cannot exceed 52 weeks'),
  programType: z.enum(['strength', 'run']).default('strength')
});

const runFormSchema = z.object({
  title: z.string().min(3, 'Program title must be at least 3 characters'),
  description: z.string().optional(),
  weeks: z.coerce.number().min(1, 'Program must have at least 1 week').max(52, 'Program cannot exceed 52 weeks'),
  programType: z.enum(['strength', 'run']).default('run'),
  weeklyGoals: z.array(z.object({
    milesGoal: z.coerce.number().min(0, 'Miles must be a positive number'),
    exercisesGoal: z.coerce.number().min(0, 'Exercises must be a positive number'),
    cardioMinutesGoal: z.coerce.number().min(0, 'Cardio minutes must be a positive number')
  }))
});

type StrengthFormValues = z.infer<typeof strengthFormSchema>;
type RunFormValues = z.infer<typeof runFormSchema>;
type FormValues = StrengthFormValues | RunFormValues;

interface WorkoutProgramFormProps {
  onSubmit: (values: any) => void;
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
  const [programType, setProgramType] = useState<'strength' | 'run'>((initialData as any)?.programType || 'strength');
  const [weekCount, setWeekCount] = useState<number>(initialData?.weeks || 4);
  
  const isRunProgram = programType === 'run';
  
  // Use the appropriate schema based on program type
  const formSchema = isRunProgram ? runFormSchema : strengthFormSchema;
  
  // Initialize weekly goals for run programs
  const initialWeeklyGoals = Array.from({ length: weekCount }, (_, i) => ({
    milesGoal: 10, // Default values
    exercisesGoal: 20,
    cardioMinutesGoal: 60
  }));
  
  const form = useForm<any>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      weeks: initialData?.weeks || 4,
      programType: (initialData as any)?.programType || 'strength',
      weeklyGoals: initialWeeklyGoals
    }
  });
  
  // Update form when program type changes
  useEffect(() => {
    form.setValue('programType', programType);
    
    if (programType === 'run' && !form.getValues('weeklyGoals')) {
      form.setValue('weeklyGoals', initialWeeklyGoals);
    }
  }, [programType, form]);
  
  // Update weekly goals array length when week count changes
  useEffect(() => {
    if (isRunProgram) {
      const currentGoals = form.getValues('weeklyGoals') || [];
      const newGoals = [...currentGoals];
      
      // Add or remove weeks as needed
      if (newGoals.length < weekCount) {
        while (newGoals.length < weekCount) {
          newGoals.push({
            milesGoal: 10,
            exercisesGoal: 20,
            cardioMinutesGoal: 60
          });
        }
      } else if (newGoals.length > weekCount) {
        newGoals.length = weekCount;
      }
      
      form.setValue('weeklyGoals', newGoals);
    }
  }, [weekCount, isRunProgram, form]);
  
  const handleSubmit = (data: any) => {
    onSubmit(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                onValueChange={(value) => {
                  field.onChange(value);
                  setProgramType(value as 'strength' | 'run');
                }}
                disabled={mode === 'edit'} // Disable changing program type in edit mode
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
                  onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    setWeekCount(parseInt(value));
                  }}
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

        {/* Run Program Specific Fields */}
        {isRunProgram && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Weekly Goals</h3>
            <div className="space-y-6">
              {Array.from({ length: weekCount }).map((_, weekIndex) => (
                <div key={weekIndex} className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-medium">Week {weekIndex + 1}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`weeklyGoals.${weekIndex}.milesGoal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miles Goal</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`weeklyGoals.${weekIndex}.exercisesGoal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercises Goal</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="20"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`weeklyGoals.${weekIndex}.cardioMinutesGoal`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cardio Minutes Goal</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="60"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
