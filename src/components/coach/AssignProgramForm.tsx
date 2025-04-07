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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchWorkoutPrograms, fetchAllClients, assignProgramToUser } from '@/services/workout-service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const formSchema = z.object({
  programId: z.string({
    required_error: 'Please select a program',
  }),
  clientId: z.string({
    required_error: 'Please select a client',
  }),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignProgramFormProps {
  initialProgramId?: string;
  onSuccess?: () => void;
}

export const AssignProgramForm: React.FC<AssignProgramFormProps> = ({ 
  initialProgramId,
  onSuccess 
}) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      programId: initialProgramId || '',
      startDate: new Date(),
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const programsData = await fetchWorkoutPrograms(user?.id);
        setPrograms(programsData);
        
        const clientsData = await fetchAllClients();
        setClients(clientsData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (initialProgramId) {
      form.setValue('programId', initialProgramId);
    }
  }, [initialProgramId, form]);

  const getClientDisplayName = (client: any): string => {
    const nameParts = [];
    
    if (client.first_name) nameParts.push(client.first_name);
    if (client.last_name) nameParts.push(client.last_name);
    
    const fullName = nameParts.length > 0 ? nameParts.join(' ') : `Client ${client.id.slice(0, 8)}`;
    
    return client.email ? `${fullName} (${client.email})` : fullName;
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('You must be logged in to assign programs');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignProgramToUser({
        program_id: values.programId,
        user_id: values.clientId,
        assigned_by: user.id,
        start_date: format(values.startDate, 'yyyy-MM-dd'),
        end_date: null
      });
      
      toast.success('Program assigned successfully');
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/coach-dashboard/workouts/${values.programId}`);
      }
    } catch (error) {
      console.error('Error assigning program:', error);
      toast.error('Failed to assign program');
    } finally {
      setIsSubmitting(false);
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert variant="default" className="bg-muted/50 border-muted-foreground/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Assigning a program to a client will make it accessible to them in their dashboard.
          </AlertDescription>
        </Alert>
        
        <FormField
          control={form.control}
          name="programId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Program</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a program" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.title}
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
          name="clientId"
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
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The program will start on this date
              </FormDescription>
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
