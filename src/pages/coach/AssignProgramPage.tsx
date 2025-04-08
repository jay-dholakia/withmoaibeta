
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { AssignProgramForm } from '@/components/coach/AssignProgramForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users } from 'lucide-react';
import { fetchAssignedUsers, fetchWorkoutProgram, fetchAllClients } from '@/services/workout-service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Define a type for assigned clients
interface AssignedClient {
  id: string;
  user_id: string;
  start_date: string;
  program_id: string;
}

interface ClientInfo {
  id: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  user_type: string;
}

const AssignProgramPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [assignedClients, setAssignedClients] = useState<AssignedClient[]>([]);
  const [clientsInfo, setClientsInfo] = useState<ClientInfo[]>([]);
  const [programTitle, setProgramTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assigned clients when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!programId) return;
      
      setIsLoading(true);
      try {
        const [assignmentsData, programData, clientsData] = await Promise.all([
          fetchAssignedUsers(programId),
          fetchWorkoutProgram(programId),
          fetchAllClients()
        ]);
        
        setAssignedClients(assignmentsData);
        if (programData) setProgramTitle(programData.title);
        setClientsInfo(clientsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [programId]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Get client name from their info
  const getClientName = (userId: string): string => {
    const client = clientsInfo.find(c => c.id === userId);
    if (!client) return 'Unknown Client';
    
    const nameParts = [];
    if (client.first_name) nameParts.push(client.first_name);
    if (client.last_name) nameParts.push(client.last_name);
    
    const name = nameParts.length > 0 ? nameParts.join(' ') : 'Client';
    return client.email ? `${name} (${client.email})` : name;
  };

  return (
    <CoachLayout>
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(`/coach-dashboard/workouts${programId ? `/${programId}` : ''}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Program
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Assign Program</CardTitle>
            <CardDescription>
              Assign "{programTitle}" to a client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignProgramForm 
              initialProgramId={programId} 
              onSuccess={() => {
                // Refresh the assigned clients list when a new assignment is made
                if (programId) {
                  fetchAssignedUsers(programId).then(data => setAssignedClients(data));
                }
              }}
            />
            
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" />
                <h3 className="text-lg font-medium">Assigned Clients</h3>
              </div>
              
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : assignedClients.length > 0 ? (
                <div className="divide-y">
                  {assignedClients.map(client => (
                    <div key={client.id} className="py-3 flex flex-wrap items-center justify-between">
                      <div>
                        <div className="font-medium">{getClientName(client.user_id)}</div>
                        <div className="text-sm text-muted-foreground">
                          Start date: {formatDate(client.start_date)}
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-1 sm:mt-0">Assigned</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed rounded-md">
                  <p className="text-sm text-muted-foreground">No clients assigned to this program yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default AssignProgramPage;
