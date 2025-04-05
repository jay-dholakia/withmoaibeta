
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { logRunActivity } from '@/services/run-goals-service';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RunFormData = {
  distance: number;
  runType: 'steady' | 'tempo' | 'long' | 'speed' | 'hill';
  notes?: string;
};

const runTypes = [
  { value: 'steady', label: 'Steady Run' },
  { value: 'tempo', label: 'Tempo Run' },
  { value: 'long', label: 'Long Run' },
  { value: 'speed', label: 'Speed Work' },
  { value: 'hill', label: 'Hill Training' },
];

const formSchema = z.object({
  distance: z.number().positive("Distance must be greater than 0"),
  runType: z.enum(['steady', 'tempo', 'long', 'speed', 'hill']),
  notes: z.string().optional(),
});

interface LogRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export default function LogRunDialog({ open, onOpenChange, onComplete }: LogRunDialogProps) {
  const { user } = useAuth();
  
  const form = useForm<RunFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: 0,
      runType: 'steady',
      notes: '',
    },
  });

  const onSubmit = async (data: RunFormData) => {
    if (!user?.id) {
      toast.error('You must be logged in to log a run');
      return;
    }

    try {
      const { success } = await logRunActivity(
        user.id, 
        data.distance, 
        data.runType, 
        data.notes
      );
      
      if (success) {
        toast.success('Run logged successfully!');
        form.reset();
        onOpenChange(false);
        if (onComplete) onComplete();
      } else {
        toast.error('Failed to log run');
      }
    } catch (error) {
      console.error('Error logging run:', error);
      toast.error('An error occurred while logging your run');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2" role="img" aria-label="Running">🏃</span>
            Log Run Activity
          </DialogTitle>
        </DialogHeader>
        
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
                      step="0.01" 
                      min="0"
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
                      {runTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How was your run?" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Run</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
