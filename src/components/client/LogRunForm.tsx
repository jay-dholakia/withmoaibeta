
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logRunActivity } from '@/services/run-goals-service';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  distance: z.coerce.number()
    .positive("Distance must be positive")
    .max(100, "Distance cannot exceed 100 miles"),
  runType: z.enum(["steady", "tempo", "long", "speed", "hill"], {
    required_error: "Please select a run type",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LogRunFormProps {
  onComplete: () => void;
}

const LogRunForm: React.FC<LogRunFormProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 0,
      runType: "steady",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to log a run");
      return;
    }

    try {
      const result = await logRunActivity(
        user.id,
        values.distance,
        values.runType as 'steady' | 'tempo' | 'long' | 'speed' | 'hill',
        values.notes
      );

      if (result.success) {
        toast.success("Run logged successfully!");
        onComplete();
      } else {
        toast.error("Failed to log run");
      }
    } catch (error) {
      console.error("Error logging run:", error);
      toast.error("An error occurred while logging your run");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="distance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Distance (miles)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Enter distance in miles"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter your run distance in miles
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="runType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Run Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select run type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="steady">Steady Run</SelectItem>
                  <SelectItem value="tempo">Tempo Run</SelectItem>
                  <SelectItem value="long">Long Run</SelectItem>
                  <SelectItem value="speed">Speed Work</SelectItem>
                  <SelectItem value="hill">Hill Training</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Select the type of run you completed
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
                  placeholder="How did your run feel? Any observations?"
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Save Run
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LogRunForm;
