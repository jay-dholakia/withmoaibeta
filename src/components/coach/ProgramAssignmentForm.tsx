
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
  Users,
  Trash2 
} from 'lucide-react';
import { format, getDay, nextMonday } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchAllClients, fetchAssignedUsers, deleteProgramAssignment } from '@/services/workout-service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Define a base interface matching what the API returns
interface ClientBase {
  id: string;
  user_type: string;
}

// Extended interface for clients with additional profile data
interface ClientInfo extends ClientBase {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<AssignedClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  
  const defaultStartDate = nextMonday(new Date());
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: defaultStartDate,
    },
    mode: 'onChange'
  });

  const loadAssignments = async () => {
    try {
      const assignments = await fetchAssignedUsers(programId);
      setAssignedClients(assignments);
      console.log('Current program assignments:', assignments);
    } catch (err) {
      console.error('Error loading program assignments:', err);
    }
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const clientsData = await fetchAllClients();
        setClients(clientsData as ClientInfo[]);
        console.log('Fetched clients for form:', clientsData);
        
        await loadAssignments();
        
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
      
      await loadAssignments();
    } catch (error) {
      console.error('Error assigning program:', error);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!clientToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteProgramAssignment(clientToDelete.id);
      toast.success('Program assignment removed successfully');
      setDeleteDialogOpen(false);
      
      await loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove program assignment');
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
    }
  };

  const openDeleteDialog = (client: AssignedClient) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const disableNonMondays = (date: Date) => {
    return getDay(date) !== 1;
  };

  const getClientDisplayName = (client: ClientInfo): string => {
    let displayName = '';
    
    if (client.first_name && client.last_name) {
      displayName = `${client.first_name} ${client.last_name}`;
    } else if (client.first_name) {
      displayName = client.first_name;
    } else {
      displayName = `Client ${client.id.substring(0, 8)}`;
    }
    
    // Add email in parentheses if available
    if (client.email) {
      displayName += ` (${client.email})`;
    }
    
    return displayName;
  };
  
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Assigned</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openDeleteDialog(assignment)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Program Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the client's access to this program. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAssignment}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
