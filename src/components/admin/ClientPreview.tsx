
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Eye } from 'lucide-react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { toast } from 'sonner';

interface Client {
  id: string;
  email: string;
  group_name: string | null;
}

export const ClientPreview = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);

  // Fetch all clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, created_at, user_type')
          .eq('user_type', 'client')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get group membership info
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id, group_id');

        const userGroupMap = groupMembers?.reduce((map, item) => {
          map[item.user_id] = item.group_id;
          return map;
        }, {} as Record<string, string>) || {};

        // Get group names
        const { data: groups } = await supabase
          .from('groups')
          .select('id, name');

        const groupNameMap = groups?.reduce((map, group) => {
          map[group.id] = group.name;
          return map;
        }, {} as Record<string, string>) || {};

        // Get emails
        const { data: emailsData, error: emailsError } = await supabase.rpc('get_users_email', {
          user_ids: profiles?.map(p => p.id) || []
        });

        if (emailsError) throw emailsError;

        const emailMap = emailsData?.reduce((map, item) => {
          map[item.id] = item.email;
          return map;
        }, {} as Record<string, string>) || {};

        // Combine data
        const clientsData: Client[] = profiles?.map(profile => ({
          id: profile.id,
          email: emailMap[profile.id] || 'Unknown email',
          group_name: userGroupMap[profile.id] ? groupNameMap[userGroupMap[profile.id]] || null : null
        })) || [];

        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Failed to load clients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fetch client preview data
  const fetchClientPreviewData = async (clientId: string) => {
    setIsLoading(true);
    try {
      // Fetch client's current program
      const { data: programData, error: programError } = await supabase.rpc(
        'is_program_assigned_to_user',
        { program_id_param: null, user_id_param: clientId }
      );

      if (programError) throw programError;

      // Fetch client's profile info
      const { data: profileData, error: profileError } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch client's workout history
      const { data: workoutHistory, error: historyError } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', clientId)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (historyError) throw historyError;

      // Combine all data
      setPreviewData({
        profile: profileData || {},
        workoutHistory: workoutHistory || [],
        hasProgram: programData || false
      });

      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error fetching client preview data:', error);
      toast.error('Failed to load client preview data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    fetchClientPreviewData(clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Select Client</label>
        <Select 
          disabled={isLoading || clients.length === 0}
          onValueChange={handleClientSelect}
          value={selectedClientId || undefined}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a client to preview" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(client => (
              <SelectItem key={client.id} value={client.id}>
                {client.email} {client.group_name && `(${client.group_name})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClientId && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={isLoading || !selectedClientId}
              onClick={() => fetchClientPreviewData(selectedClientId)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading Preview...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Client View
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl" fullScreen={true} hideClose={false}>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>
                  Client Preview: {clients.find(c => c.id === selectedClientId)?.email}
                </span>
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                  Exit Preview
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              <ClientLayout>
                <div className="p-4">
                  <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
                  
                  {previewData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border rounded-lg p-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
                        {previewData.profile ? (
                          <div className="space-y-2">
                            <p><strong>Name:</strong> {previewData.profile.first_name || 'N/A'} {previewData.profile.last_name || ''}</p>
                            <p><strong>Location:</strong> {previewData.profile.city || 'N/A'}{previewData.profile.city && previewData.profile.state ? ', ' : ''}{previewData.profile.state || ''}</p>
                            <p><strong>Height:</strong> {previewData.profile.height || 'N/A'}</p>
                            <p><strong>Weight:</strong> {previewData.profile.weight || 'N/A'}</p>
                            <p><strong>Goals:</strong> {previewData.profile.fitness_goals?.join(', ') || 'N/A'}</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No profile information available.</p>
                        )}
                      </div>
                      
                      <div className="border rounded-lg p-4 shadow-sm">
                        <h2 className="text-lg font-semibold mb-2">Program Status</h2>
                        {previewData.hasProgram ? (
                          <p className="text-green-600">Client has an active program assigned.</p>
                        ) : (
                          <p className="text-amber-600">Client does not have any program assigned.</p>
                        )}
                      </div>
                      
                      <div className="border rounded-lg p-4 shadow-sm md:col-span-2">
                        <h2 className="text-lg font-semibold mb-2">Recent Workouts</h2>
                        {previewData.workoutHistory && previewData.workoutHistory.length > 0 ? (
                          <div className="space-y-2">
                            {previewData.workoutHistory.map((workout: any) => (
                              <div key={workout.id} className="border-b pb-2">
                                <p><strong>Date:</strong> {new Date(workout.completed_at).toLocaleDateString()}</p>
                                <p><strong>Type:</strong> {workout.workout_type || 'Standard'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No recent workout history found.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </ClientLayout>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
