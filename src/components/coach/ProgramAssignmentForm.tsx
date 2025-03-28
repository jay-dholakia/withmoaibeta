
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
import { 
  CalendarIcon, 
  AlertCircle, 
  Users 
} from 'lucide-react';
import { format, getDay, nextMonday } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllClients, fetchAssignedUsers } from '@/services/workout-service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface AssignedClient {
  id: string;
  user_id: string;
  start_date: string;
  program_id: string;
}

export const ProgramAssignmentForm: React.FC<ProgramAssignmentFormProps> = ({
  programId,
  onAssign,
  isSubmitting
}) => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([]);
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
        const typedClients: ClientInfo[] = Array.isArray(clientsData) 
          ? clientsData.map(client => ({
              id: client.id || '',
              email: client.email || 'N/A',
              user_type: client.user_type || undefined
            }))
          : [];
          
        console.log('Fetched clients for form:', typedClients);
        setClients(typedClients);
        
        // Load assigned clients for this program
        try {
          const assignments = await fetchAssignedUsers(programId);
          setAssignedClients(assignments);
          console.log('Current program assignments:', assignments);
        } catch (err) {
          console.error('Error loading program assignments:', err);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients');
        setIsLoading(false);
      }
    };

    loadClients();
  }, [programId]);

  const onSubmit = async (values: FormValues) => {
    console.log('Form values on submit:', values);
    try {
      const startDate = new Date(values.startDate);
      await onAssign(values.userId, startDate);
      form.reset({
        startDate: nextMonday(new Date()),
      });
      
      // Refresh assigned clients after assignment
      const assignments = await fetchAssignedUsers(programId);
      setAssignedClients(assignments);
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
  
  // Filter out clients that are already assigned to this program
  const availableClients = clients.filter(client => 
    !assignedClients.some(assigned => assigned.user_id === client.id && assigned.program_id === programId)
  );

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

  if (availableClients.length === 0 && assignedClients.length === 0) {
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
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Alert variant="default" className="bg-muted/50 border-muted-foreground/30 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              When you assign a program, week 1 will start on the Monday you select. This ensures proper alignment with the workout schedule.
            </AlertDescription>
          </Alert>
          
          {availableClients.length > 0 ? (
            <>
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
                        {availableClients.map(client => (
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
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">All available clients have been assigned to this program</p>
            </div>
          )}
        </form>
      </Form>
      
      {assignedClients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Clients Assigned to this Program
            </CardTitle>
            <CardDescription>
              {assignedClients.length} client{assignedClients.length !== 1 ? 's' : ''} currently assigned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {assignedClients.map(assignment => {
                const client = clients.find(c => c.id === assignment.user_id);
                return (
                  <li key={assignment.id} className="flex items-center justify-between p-2 border rounded-md">
                    <div>
                      <p className="font-medium">{client ? getClientDisplayName(client) : 'Unknown Client'}</p>
                      <p className="text-sm text-muted-foreground">
                        Start date: {format(new Date(assignment.start_date), "PPP")}
                      </p>
                    </div>
                    <Badge variant="outline">Assigned</Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
