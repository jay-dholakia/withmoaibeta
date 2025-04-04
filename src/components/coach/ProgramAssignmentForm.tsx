
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllClients } from '@/services/workout-service';
import { upsertRunGoals } from '@/services/run-service';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface ProgramAssignmentFormProps {
  programId?: string;
  onAssign: (userId: string, startDate: Date) => Promise<void>;
  isSubmitting: boolean;
}

type ClientOption = {
  label: string;
  value: string;
};

export const ProgramAssignmentForm: React.FC<ProgramAssignmentFormProps> = ({
  programId,
  onAssign,
  isSubmitting,
}) => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For Moai Run setup
  const [programType, setProgramType] = useState<'strength' | 'run'>('strength');
  const [runGoals, setRunGoals] = useState({
    miles_goal: 10,
    exercises_goal: 20,
    cardio_minutes_goal: 60
  });

  useEffect(() => {
    const loadClients = async () => {
      if (!user) return;
      
      setIsLoadingClients(true);
      try {
        const clientsData = await fetchAllClients();
        
        if (clientsData && Array.isArray(clientsData)) {
          const formattedClients = clientsData.map(client => ({
            label: client.email || `Client ${client.id.slice(0, 6)}`,
            value: client.id
          }));
          
          setClients(formattedClients);
        } else {
          console.error('Clients data is not an array:', clientsData);
          setClients([]);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast.error('Failed to load clients');
        setClients([]);
      } finally {
        setIsLoadingClients(false);
      }
    };
    
    loadClients();
  }, [user]);

  const filteredClients = searchQuery && clients 
    ? clients.filter(client => 
        client.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clients || [];

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    
    // Fetch the client's current program type
    const fetchClientProgramType = async () => {
      try {
        const { data, error } = await supabase
          .from('client_profiles')
          .select('program_type')
          .eq('id', clientId)
          .single();
          
        if (error) {
          console.error('Error fetching program type:', error);
          return;
        }
        
        if (data) {
          setProgramType(data.program_type as 'strength' | 'run' || 'strength');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    fetchClientProgramType();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }
    
    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }
    
    try {
      // First update the client's program type
      const { error: profileUpdateError } = await supabase
        .from('client_profiles')
        .update({ 
          program_type: programType 
        })
        .eq('id', selectedClientId);
        
      if (profileUpdateError) {
        console.error('Error updating program type:', profileUpdateError);
        toast.error('Failed to update program type');
        return;
      }
      
      // If Moai Run, also update run goals
      if (programType === 'run') {
        const success = await upsertRunGoals({
          user_id: selectedClientId,
          miles_goal: runGoals.miles_goal,
          exercises_goal: runGoals.exercises_goal,
          cardio_minutes_goal: runGoals.cardio_minutes_goal,
          created_by: user?.id
        });
        
        if (!success) {
          toast.error('Failed to update run goals');
          return;
        }
      }
      
      // If a programId is provided, assign it
      if (programId) {
        await onAssign(selectedClientId, startDate);
      } else {
        toast.success(`Client program type updated to Moai ${programType === 'run' ? 'Run' : 'Strength'}`);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('An error occurred during assignment');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Select a Client</Label>
          {isLoadingClients ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <Command className="border rounded-md">
              <CommandInput 
                placeholder="Search clients..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup className="max-h-60 overflow-y-auto">
                {filteredClients && filteredClients.length > 0 ? (
                  filteredClients.map(client => (
                    <CommandItem
                      key={client.value}
                      value={client.value}
                      onSelect={() => handleClientSelect(client.value)}
                      className={cn(
                        "flex items-center justify-between cursor-pointer",
                        selectedClientId === client.value && "bg-accent"
                      )}
                    >
                      <span>{client.label}</span>
                      {selectedClientId === client.value && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </CommandItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    No clients available
                  </div>
                )}
              </CommandGroup>
            </Command>
          )}
        </div>

        <div className="space-y-4">
          <Label>Program Type</Label>
          <Select value={programType} onValueChange={(value: 'strength' | 'run') => setProgramType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select program type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Moai Strength</SelectItem>
              <SelectItem value="run">Moai Run</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {programType === 'run' && (
          <Card>
            <CardHeader>
              <CardTitle>Moai Run Goals</CardTitle>
              <CardDescription>Set weekly goals for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="miles_goal">Weekly Miles Goal</Label>
                <Input 
                  id="miles_goal" 
                  type="number" 
                  value={runGoals.miles_goal} 
                  onChange={(e) => setRunGoals(prev => ({...prev, miles_goal: parseInt(e.target.value) || 0}))} 
                  min="1"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exercises_goal">Weekly Exercises Goal</Label>
                <Input 
                  id="exercises_goal" 
                  type="number" 
                  value={runGoals.exercises_goal} 
                  onChange={(e) => setRunGoals(prev => ({...prev, exercises_goal: parseInt(e.target.value) || 0}))} 
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardio_minutes_goal">Weekly Cardio Minutes Goal</Label>
                <Input 
                  id="cardio_minutes_goal" 
                  type="number" 
                  value={runGoals.cardio_minutes_goal} 
                  onChange={(e) => setRunGoals(prev => ({...prev, cardio_minutes_goal: parseInt(e.target.value) || 0}))} 
                  min="1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {programId && (
          <div className="space-y-4">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={!selectedClientId || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Assigning...
            </>
          ) : (
            programId ? "Assign Program" : "Update Client Settings"
          )}
        </Button>
      </div>
    </form>
  );
};
