
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
  FormMessage,
  FormDescription
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
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format, getDay, nextMonday } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllClients } from '@/services/workout-service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  userId: z.string({
    required_error: 'Please select a client',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }).refine(date => getDay(date) === 1, {
    message: 'Start date must be a Monday to properly align with week 1',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgramAssignmentFormProps {
  programId: string;
  onAssign: (userId: string, startDate: Date) => Promise<void>;
  isSubmitting: boolean;
}

interface ClientInfo {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_type?: string;
}

export const ProgramAssignmentForm: React.FC<ProgramAssignmentFormProps> = ({
  programId,
  onAssign,
  isSubmitting
}) => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const defaultStartDate = nextMonday(new Date());
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: defaultStartDate,
    },
    mode: 'onChange'
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const clientsData = await fetchAllClients();
        
        // Transform the data to ensure it matches the ClientInfo interface
        // This handles the case where clientsData might not have all required properties
        const typedClients: ClientInfo[] = Array.isArray(clientsData) 
          ? clientsData.map(client => ({
              id: client.id || '',
              email: client.email || 'N/A',
              first_name: client.first_name || undefined,
              last_name: client.last_name || undefined,
              user_type: client.user_type || undefined
            }))
          : [];
          
        console.log('Fetched clients for form:', typedClients);
        setClients(typedClients);
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
    console.log('Form values on submit:', values);
    try {
      const startDate = new Date(values.startDate);
      await onAssign(values.userId, startDate);
      form.reset({
        startDate: nextMonday(new Date()),
      });
    } catch (error) {
      console.error('Error assigning program:', error);
    }
  };

  const disableNonMondays = (date: Date) => {
    return getDay(date) !== 1;
  };

  const getClientDisplayName = (client: ClientInfo): string => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    } else if (client.first_name) {
      return client.first_name;
    } else {
      return client.email;
    }
  };

  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log('Form values changed:', value);
      console.log('Form errors:', form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

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
        <Alert variant="default" className="bg-muted/50 border-muted-foreground/30 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            When you assign a program, week 1 will start on the Monday you select. This ensures proper alignment with the workout schedule.
          </AlertDescription>
        </Alert>
        
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {getClientDisplayName(client)}
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
              <FormLabel>Start Date for Week 1</FormLabel>
              <FormDescription>
                Must be a Monday to properly align with program weeks
              </FormDescription>
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
                        <span>Pick a Monday</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(date);
                        console.log('Date selected:', date);
                      }
                    }}
                    disabled={(date) => 
                      date < new Date() || disableNonMondays(date)
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
          {isSubmitting ? 'Assigning...' : 'Assign Program'}
        </Button>
      </form>
    </Form>
  );
};
