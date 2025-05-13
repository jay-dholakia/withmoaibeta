
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

// Client type with workouts count
interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_workouts_completed: number;
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
      
      const { data: coachClients, error } = await supabase.rpc('get_coach_clients', {
        coach_id: user.id
      });
      
      if (error) {
        console.error('Error fetching coach clients:', error);
        return [];
      }

      // Sort clients by workout count in descending order
      return coachClients.sort((a: Client, b: Client) => 
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
      const selectedClient = clients.find((c: Client) => c.id === selectedClientId);
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
