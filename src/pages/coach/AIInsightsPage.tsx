
import React, { useState, useEffect } from 'react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bot, Search, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';

// Interface to match the data structure returned from the API
interface Client {
  id: string;
  email: string;
  user_type: string;
  first_name: string | null;
  last_name: string | null;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

// Define the shape of the client_profiles data in the response
interface ClientProfileData {
  first_name: string | null;
  last_name: string | null;
}

// Interface for the data structure returned by the Supabase query
interface ClientWorkoutInfo {
  user_id: string;
  user_type: string;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  profiles: {
    id: string;
    user_type: string;
  };
  client_profiles: ClientProfileData[];
}

const AIInsightsPage = () => {
  const { user } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch clients for the coach
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['coach-clients-for-ai', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Instead of using the RPC function directly, let's use a more flexible approach
      // with the coach-clients-service that handles the type conversions properly
      const { data: coachClients, error } = await supabase
        .from('client_workout_info')
        .select(`
          user_id,
          user_type,
          last_workout_at,
          total_workouts_completed,
          current_program_id,
          profiles!inner(id, user_type),
          client_profiles(first_name, last_name)
        `)
        .eq('user_type', 'client');
      
      if (error) {
        console.error('Error fetching coach clients:', error);
        return [];
      }
      
      // Get emails for these clients
      const clientIds = coachClients.map(client => client.user_id);
      const { data: emails } = await supabase.rpc('get_users_email', {
        user_ids: clientIds
      });
      
      const emailMap = new Map(emails ? emails.map(e => [e.id, e.email]) : []);
      
      // Transform the data to match expected Client interface
      const formattedClients = coachClients.map((client: ClientWorkoutInfo) => {
        // Fix: Properly access client_profiles array and its properties
        const clientProfile = client.client_profiles && client.client_profiles.length > 0 
          ? client.client_profiles[0] 
          : null;
        
        return {
          id: client.user_id,
          email: emailMap.get(client.user_id) || 'Unknown',
          user_type: client.user_type,
          first_name: clientProfile?.first_name || null,
          last_name: clientProfile?.last_name || null,
          last_workout_at: client.last_workout_at,
          total_workouts_completed: client.total_workouts_completed || 0,
          current_program_id: client.current_program_id,
          current_program_title: null, // We'll need another query to get this
          days_since_last_workout: client.last_workout_at
            ? Math.ceil((new Date().getTime() - new Date(client.last_workout_at).getTime()) / (1000 * 60 * 60 * 24))
            : null,
          group_ids: []
        } as Client;
      });

      // Sort clients by workout count in descending order
      return formattedClients.sort((a, b) => 
        (b.total_workouts_completed || 0) - (a.total_workouts_completed || 0)
      );
    },
    enabled: !!user?.id,
  });

  // Format the display name to show full first name and initial of last name
  const formatClientName = (client: Client): string => {
    if (client.first_name) {
      return `${client.first_name}${client.last_name ? ` ${client.last_name.charAt(0)}.` : ''}`;
    }
    // Fallback to email username if profile not available
    return client.email.split('@')[0];
  };

  // Filter clients by name
  const filteredClients = clients.filter((client: Client) => {
    const searchTerm = searchQuery.toLowerCase();
    const fullName = `${client.first_name || ''} ${client.last_name || ''}`.toLowerCase();
    const email = client.email.toLowerCase();
    
    return fullName.includes(searchTerm) || email.includes(searchTerm);
  });

  const handleGenerateInsights = async () => {
    if (!query.trim()) {
      toast.error('Please enter a question about your client');
      return;
    }

    if (!selectedClientId) {
      toast.error('Please select a client first');
      return;
    }

    setIsLoading(true);
    setResponse('');

    try {
      // Find the selected client to include their name in the question
      const selectedClient = clients.find((client: Client) => client.id === selectedClientId);
      const clientName = selectedClient ? formatClientName(selectedClient) : 'the client';
      
      const enhancedQuery = `Query about ${clientName}: ${query}`;
      
      // Here you would call your API to get AI insights
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        const sampleResponses = [
          `Based on ${clientName}'s workout history, they're making steady progress with their strength training. I recommend increasing weight by 5-10% for their next session.`,
          `${clientName} has been consistent with workouts, completing 85% of assigned sessions. Their endurance metrics show a 12% improvement over the last month.`,
          `I've analyzed ${clientName}'s performance data and noticed they struggle most with upper body exercises. Consider modifying their program to include more progressive shoulder and chest work.`,
          `${clientName}'s nutrition logs indicate adequate protein intake but possibly insufficient carbohydrates on training days. This might explain the fatigue reported in their recent workout notes.`
        ];
        
        setResponse(sampleResponses[Math.floor(Math.random() * sampleResponses.length)]);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-7 w-7 text-coach" />
          <h1 className="text-3xl font-bold text-coach">AI Insights</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              Generate Client Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="clientSearch" className="text-sm font-medium">
                Search Clients
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clientSearch"
                  placeholder="Search by name or email"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="clientSelect" className="text-sm font-medium">
                Select Client
              </label>
              {isLoadingClients ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-coach" />
                </div>
              ) : (
                <Select 
                  value={selectedClientId} 
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger id="clientSelect">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClients.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{formatClientName(client)}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.total_workouts_completed || 0} workouts
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="p-2 text-center text-muted-foreground">
                        No clients found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="queryInput" className="text-sm font-medium">
                Ask about your client
              </label>
              <Textarea
                id="queryInput"
                placeholder="e.g., How is their workout consistency? What areas are they struggling with?"
                rows={3}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Button 
              onClick={handleGenerateInsights} 
              disabled={isLoading || !selectedClientId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating insights...
                </>
              ) : (
                <>
                  <Bot className="mr-2 h-4 w-4" />
                  Generate Insights
                </>
              )}
            </Button>
            
            {response && (
              <div className="mt-4 p-4 bg-muted rounded-md border">
                <h3 className="font-medium mb-2">AI Response:</h3>
                <p className="text-sm">{response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default AIInsightsPage;
