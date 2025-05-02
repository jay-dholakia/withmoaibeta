import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { AssignProgramForm } from '@/components/coach/AssignProgramForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Trash2 } from 'lucide-react';
import { fetchAssignedUsers, fetchWorkoutProgram, fetchAllClients, deleteProgramAssignment } from '@/services/program-service';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<AssignedClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const openDeleteDialog = (client: AssignedClient) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAssignment = async () => {
    if (!clientToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteProgramAssignment(clientToDelete.id);
      toast.success('Program assignment removed successfully');
      
      // Update the client list after deletion
      setAssignedClients(prev => prev.filter(client => client.id !== clientToDelete.id));
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove program assignment');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  return (
    <CoachLayout>
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(`/coach-dashboard/workouts/${programId}`)}
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="mt-1 sm:mt-0">Assigned</Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive/10" 
                          onClick={() => openDeleteDialog(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
    </CoachLayout>
  );
};

export default AssignProgramPage;
