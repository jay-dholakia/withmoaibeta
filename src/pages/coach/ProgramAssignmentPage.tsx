import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchWorkoutProgram } from '@/services/workout-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { assignProgramToUser } from '@/services/workout-service';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllClients } from '@/services/workout-service';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

const ProgramAssignmentPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const { data: program, isLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: () => fetchWorkoutProgram(programId!),
    enabled: !!programId,
  });

  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;
      
      setIsLoadingClients(true);
      try {
        const clientsData = await fetchAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    loadClients();
  }, [user]);

  const handleSelectClient = (client: any) => {
    setSelectedClient(client);
    setIsClientDropdownOpen(false);
  };

  const handleAssignProgram = async () => {
    if (!programId || !selectedClient || !selectedDate || !user) {
      toast.error('Please select a client and start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await assignProgramToUser({
        program_id: programId,
        user_id: selectedClient.id,
        assigned_by: user.id,
        start_date: format(selectedDate, 'yyyy-MM-dd'),
        end_date: null
      });
      
      toast.success(`Program assigned to ${selectedClient.email}`);
      navigate(`/coach-dashboard/programs/${programId}`);
    } catch (error) {
      console.error('Error assigning program:', error);
      toast.error('Failed to assign program');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-8">
        <p>Program not found</p>
        <Button 
          variant="link" 
          onClick={() => navigate('/coach-dashboard/programs')}
          className="mt-2"
        >
          Back to Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-4" 
        onClick={() => navigate(`/coach-dashboard/programs/${programId}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Program
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Assign Program</CardTitle>
          <CardDescription>
            Assign "{program.title}" to a client
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Select Client</Label>
            <Popover open={isClientDropdownOpen} onOpenChange={setIsClientDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isClientDropdownOpen}
                  className="w-full justify-between"
                >
                  {selectedClient ? selectedClient.email : "Select client..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search clients..." />
                  <CommandEmpty>No clients found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-auto">
                    {clients.map(client => {
                      const displayName = client.email.split('@')[0];
                      return (
                        <CommandItem 
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleSelectClient(client)}
                        >
                          {displayName}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleAssignProgram} 
            disabled={isSubmitting || !selectedClient || !selectedDate}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Program'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProgramAssignmentPage;
