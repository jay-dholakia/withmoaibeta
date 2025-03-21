
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, CalendarRange, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgramAssignmentForm } from '@/components/coach/ProgramAssignmentForm';
import { 
  fetchWorkoutProgram, 
  fetchAssignedUsers,
  assignProgramToUser,
  fetchAllClients
} from '@/services/workout-service';
import { WorkoutProgram, ProgramAssignment } from '@/types/workout';
import { toast } from 'sonner';

interface ClientInfo {
  id: string;
  displayName: string;
}

const ProgramAssignmentPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [assignments, setAssignments] = useState<ProgramAssignment[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        
        // Fetch all clients to build a map of id -> displayName
        const clientsData = await fetchAllClients();
        const clientsMapData = clientsData.reduce((acc, client) => {
          acc[client.id] = client.email; // 'email' is actually displayName after our update
          return acc;
        }, {} as Record<string, string>);
        
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
  
  // Helper to get client display name from ID
  const getClientDisplayName = (userId: string): string => {
    return clientsMap[userId] || `Client ${userId.slice(0, 6)}...`;
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
                  {assignments.map(assignment => (
                    <div 
                      key={assignment.id} 
                      className="p-3 border rounded-md"
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{getClientDisplayName(assignment.user_id)}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(assignment.start_date).toLocaleDateString()} to {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
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
