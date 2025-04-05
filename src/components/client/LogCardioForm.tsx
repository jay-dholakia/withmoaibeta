
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { logCardioActivity } from '@/services/run-goals-service';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { createOneOffWorkoutCompletion } from '@/services/workout-history-service';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  minutes: z.coerce.number()
    .positive("Minutes must be positive")
    .max(600, "Duration cannot exceed 600 minutes"),
  activityType: z.string().min(1, "Please select an activity type"),
  notes: z.string().optional(),
  date: z.date({
    required_error: "Please select a date",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface LogCardioFormProps {
  onComplete: () => void;
  defaultDate?: Date;
}

const CARDIO_ACTIVITY_TYPES = [
  "cycling", "dance", "hiit", "elliptical", "rowing", 
  "swimming", "stair_climbing", "jump_rope", "aerobics", "other"
];

const LogCardioForm: React.FC<LogCardioFormProps> = ({ onComplete, defaultDate = new Date() }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minutes: 30,
      activityType: "cycling",
      notes: "",
      date: defaultDate,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to log a cardio activity");
      return;
    }

    try {
      // 1. Log the cardio activity to cardio_activities table
      const result = await logCardioActivity(
        user.id,
        values.minutes,
        values.activityType,
        values.notes,
        values.date
      );

      // 2. Also log as a workout completion to show in workout history
      await createOneOffWorkoutCompletion({
        title: `${values.minutes} min ${values.activityType}`,
        workout_type: 'cardio',
        description: `Cardio: ${values.activityType} for ${values.minutes} minutes`,
        notes: values.notes,
        duration: `${values.minutes} minutes`,
        completed_at: values.date.toISOString(),
      });

      if (result.success) {
        toast.success("Cardio activity logged successfully!");
        
        // Invalidate related queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['weekly-run-progress'] });
        queryClient.invalidateQueries({ queryKey: ['client-workouts'] });
        queryClient.invalidateQueries({ queryKey: ['client-workouts-week-progress'] });
        queryClient.invalidateQueries({ queryKey: ['client-workouts-leaderboard'] });
        
        onComplete();
      } else {
        toast.error("Failed to log cardio activity");
      }
    } catch (error) {
      console.error("Error logging cardio activity:", error);
      toast.error("An error occurred while logging your cardio activity");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter duration in minutes"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                How many minutes did you complete?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activityType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CARDIO_ACTIVITY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                What type of cardio activity did you do?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select the date when you completed this activity
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="How did your cardio session feel? Any observations?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-red-600 hover:bg-red-700">
            Save Cardio Activity
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LogCardioForm;
