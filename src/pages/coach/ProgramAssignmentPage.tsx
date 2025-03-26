
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, CalendarRange, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramAssignmentForm } from '@/components/coach/ProgramAssignmentForm';
import { 
  fetchWorkoutProgram, 
  fetchAssignedUsers,
  assignProgramToUser,
  fetchAllClients,
  deleteProgramAssignment
} from '@/services/workout-service';
import { WorkoutProgram, ProgramAssignment } from '@/types/workout';
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
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ClientInfo {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
}

const ProgramAssignmentPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, ClientInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (!programId) return;
    
    const loadProgramAndAssignments = async () => {
      try {
        setIsLoading(true);
        
        // Fetch program details
        const programData = await fetchWorkoutProgram(programId);
        setProgram(programData);
        
        // Fetch assignments
        const assignmentsData = await fetchAssignedUsers(programId);
        setAssignments(assignmentsData);
        
        // Fetch all clients to build a map of id -> clientInfo
        const clientsData = await fetchAllClients();
        const clientsMapData = clientsData.reduce((acc, client) => {
          acc[client.id] = {
            id: client.id,
            email: client.email,
            firstName: client.first_name,
            lastName: client.last_name,
            displayName: getClientDisplayName(client)
          };
          return acc;
        }, {} as Record<string, ClientInfo>);
        
        setClientsMap(clientsMapData);
        console.log('Client display names map:', clientsMapData);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading program and assignments:', error);
        toast.error('Failed to load program details');
        setIsLoading(false);
      }
    };
    
    loadProgramAndAssignments();
  }, [programId]);
  
  // Helper function to format client display name from their info
  const getClientDisplayName = (client: any): string => {
    if (client.first_name && client.last_name) {
      return `${client.first_name} ${client.last_name}`;
    } else if (client.first_name) {
      return client.first_name;
    } else if (client.email) {
      return client.email;
    } else {
      return `Client ${client.id.slice(0, 6)}...`;
    }
  };
  
  const handleAssign = async (userId: string, startDate: Date) => {
    if (!programId || !user) {
      toast.error('Missing required data');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Calculate end date based on program duration
      const endDate = new Date(startDate);
      if (program && typeof program.weeks === 'number') {
        endDate.setDate(endDate.getDate() + (program.weeks * 7));
      }
      
      const assignmentData = {
        program_id: programId,
        user_id: userId,
        assigned_by: user.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
      
      const newAssignment = await assignProgramToUser(assignmentData);
      
      setAssignments(prev => [newAssignment, ...prev]);
      toast.success('Program assigned successfully');
    } catch (error) {
      console.error('Error assigning program:', error);
      toast.error('Failed to assign program');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const success = await deleteProgramAssignment(assignmentId);
      
      if (success) {
        setAssignments(prev => prev.filter(assignment => assignment.id !== assignmentId));
        toast.success('Assignment removed successfully');
      } else {
        toast.error('Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to remove assignment');
    } finally {
      setAssignmentToDelete(null);
    }
  };
  
  // Helper to get client display name from ID
  const getClientInfo = (userId: string): ClientInfo => {
    return clientsMap[userId] || { 
      id: userId, 
      email: `Client ${userId.slice(0, 6)}...`,
      displayName: `Client ${userId.slice(0, 6)}...`
    };
  };
  
  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2 mt-6"></div>
            <div className="h-40 bg-muted rounded mt-6"></div>
          </div>
        </div>
      </CoachLayout>
    );
  }
  
  if (!program) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold mb-2">Program Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The workout program you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/coach-dashboard/workouts')}>
              Back to Programs
            </Button>
          </div>
        </div>
      </CoachLayout>
    );
  }
  
  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={() => navigate(`/coach-dashboard/workouts/${programId}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Program
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Assign Program: {program.title}</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign to Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgramAssignmentForm
                programId={programId || ''}
                onAssign={handleAssign}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5" />
                Current Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    This program hasn't been assigned to any clients yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const clientInfo = getClientInfo(assignment.user_id);
                    return (
                      <div 
                        key={assignment.id} 
                        className="p-3 border rounded-md"
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{clientInfo.displayName}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(assignment.start_date).toLocaleDateString()} to {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Program Assignment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this program assignment from {clientInfo.displayName}? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove Assignment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
};

export default ProgramAssignmentPage;
