
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Dumbbell, BarChart3, Award, Heart, FileText } from 'lucide-react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { fetchWorkoutPrograms } from '@/services/workout-service';
import { Card } from '@/components/ui/card';
import { fetchCoachGroups } from '@/services/coach-service';

const CoachDashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  // Debugging: Log user details when component mounts
  useEffect(() => {
    if (user) {
      console.log('Coach dashboard mounted for user:', user.id, 'with type:', userType);
    }
  }, [user, userType]);

  // Use the fetchCoachGroups service instead of inline query
  const { data: coachGroups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      console.log('Using coach service to fetch groups for coach ID:', user.id);
      try {
        const groups = await fetchCoachGroups(user.id);
        
        // If no groups are found, check the group_coaches table directly for debugging
        if (!groups || groups.length === 0) {
          console.log('No groups found from service, checking group_coaches table directly');
          
          // For debugging: Get all group_coaches entries for this specific coach
          const { data: specificCoachAssignments, error: specificError } = await supabase
            .from('group_coaches')
            .select('*')
            .eq('coach_id', user.id);
            
          if (specificError) {
            console.error('Error fetching specific coach assignments:', specificError);
          } else {
            console.log('Direct query for coach assignments:', specificCoachAssignments);
          }
          
          // Check all group_coaches entries to see if the coach exists with a different ID format
          const { data: allGroupCoaches, error: allGroupCoachesError } = await supabase
            .from('group_coaches')
            .select('*');
            
          if (allGroupCoachesError) {
            console.error('Error fetching all group coaches:', allGroupCoachesError);
          } else {
            console.log('All group coaches in the system:', allGroupCoaches);
            
            // Check if this coach ID exists in a different format (case sensitivity, etc.)
            if (allGroupCoaches && allGroupCoaches.length > 0) {
              const possibleMatches = allGroupCoaches.filter(gc => 
                gc.coach_id.toLowerCase() === user.id.toLowerCase() || 
                gc.coach_id.replace(/-/g, '') === user.id.replace(/-/g, '')
              );
              
              if (possibleMatches.length > 0) {
                console.log('Possible matches with different ID format:', possibleMatches);
              }
            }
          }
        }
        
        return groups;
      } catch (error) {
        console.error('Error in coach groups query function:', error);
        toast.error('Error loading your assigned groups');
        return [];
      }
    },
    enabled: !!user && userType === 'coach'
  });

  // Force a refetch when the component mounts
  useEffect(() => {
    if (user && userType === 'coach') {
      refetchGroups();
    }
  }, [user, userType, refetchGroups]);

  const { data: workoutPrograms, isLoading: programsLoading } = useQuery({
    queryKey: ['coach-workout-programs', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      return fetchWorkoutPrograms(user.id);
    },
    enabled: !!user && userType === 'coach'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-coach" />
      </div>
    );
  }

  if (!user || userType !== 'coach') {
    return <div>Unauthorized access</div>;
  }

  return (
    <CoachLayout>
      <h1 className="text-3xl font-bold text-coach mb-8">Coach Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-coach" />
            <h2 className="text-xl font-semibold">My Groups and Clients</h2>
          </div>
          
          {groupsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-coach" />
            </div>
          ) : coachGroups && coachGroups.length > 0 ? (
            <div className="space-y-3">
              {coachGroups.slice(0, 3).map(group => (
                <div key={group.id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                  <h3 className="font-medium">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.description || 'No description'}</p>
                </div>
              ))}
              {coachGroups.length > 3 && (
                <Button 
                  variant="ghost" 
                  className="text-coach hover:text-coach/80 w-full"
                  onClick={() => navigate('/coach-dashboard/clients')}
                >
                  View all {coachGroups.length} groups
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/30 rounded-lg">
              <p>You haven't been assigned to any groups yet.</p>
              <Button 
                variant="ghost" 
                className="text-coach mt-2"
                onClick={() => refetchGroups()}
              >
                Refresh Groups
              </Button>
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Your Coach ID: {user.id}</p>
                <p>If this issue persists, please contact the admin.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="h-5 w-5 text-coach" />
            <h2 className="text-xl font-semibold">Workout Programs</h2>
          </div>
          
          {programsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-coach" />
            </div>
          ) : workoutPrograms?.length ? (
            <div className="space-y-3">
              {workoutPrograms.slice(0, 3).map(program => (
                <div 
                  key={program.id} 
                  className="border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/coach-dashboard/workouts/${program.id}`)}
                >
                  <h3 className="font-medium">{program.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {program.description?.substring(0, 60) || 'No description'}
                    {program.description && program.description.length > 60 ? '...' : ''}
                  </p>
                </div>
              ))}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/coach-dashboard/workouts')}
                >
                  View all programs
                </Button>
                <Button 
                  variant="default" 
                  className="bg-coach hover:bg-coach/90"
                  onClick={() => navigate('/coach-dashboard/workouts/new')}
                >
                  Create program
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 bg-muted/30 rounded-lg">
              <p className="mb-4">You haven't created any workout programs yet.</p>
              <Button onClick={() => navigate('/coach-dashboard/workouts/new')}>
                Create Your First Program
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-coach" />
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
          </div>
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p>Performance analytics coming soon!</p>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-coach" />
            <h2 className="text-xl font-semibold">Leaderboards</h2>
          </div>
          <div className="flex flex-col items-center py-6 bg-muted/30 rounded-lg">
            <p className="mb-4">Track your clients' workout completions!</p>
            <Button 
              onClick={() => navigate('/coach-dashboard/leaderboards')}
              className="bg-coach hover:bg-coach/90"
            >
              View Leaderboards
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-coach" />
            <h2 className="text-xl font-semibold">Coach Bio</h2>
          </div>
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p>Coach bio editor coming soon!</p>
            <Button 
              variant="ghost" 
              className="mt-2 text-coach"
              onClick={() => navigate('/coach-dashboard/profile')}
            >
              Set up your profile
            </Button>
          </div>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default CoachDashboard;
