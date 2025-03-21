
import React, { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllClients } from '@/services/workout-service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  userId: z.string({
    required_error: 'Please select a client',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramAssignmentFormProps {
  programId: string;
  onAssign: (userId: string, startDate: Date) => Promise<void>;
  isSubmitting: boolean;
}

export const ProgramAssignmentForm: React.FC<ProgramAssignmentFormProps> = ({
  programId,
  onAssign,
  isSubmitting
}) => {
  const [clients, setClients] = useState<{ id: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(),
    }
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAllClients();
        console.log('Fetched clients:', data); // Debug log to see what clients are being fetched
        setClients(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients');
        setIsLoading(false);
      }
    };

    loadClients();
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      await onAssign(values.userId, values.startDate);
      form.reset({
        startDate: new Date(),
      });
    } catch (error) {
      console.error('Error assigning program:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-10 bg-muted rounded w-1/3"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-6 border border-dashed rounded-lg">
        <p className="text-muted-foreground">No clients available to assign</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clients need to be registered before you can assign programs
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.email}
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
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
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
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Assigning...' : 'Assign Program'}
        </Button>
      </form>
    </Form>
  );
};
