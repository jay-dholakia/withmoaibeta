
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

const CoachDashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();

  // Debugging: Log user details when component mounts
  useEffect(() => {
    if (user) {
      console.log('Coach dashboard mounted for user:', user.id, 'with type:', userType);
    }
  }, [user, userType]);

  const { data: coachGroups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      console.log('Fetching coach groups for coach ID:', user.id);
      
      // Get groups the coach is assigned to - using explicit coach_id condition
      const { data: groupCoaches, error: groupCoachesError } = await supabase
        .from('group_coaches')
        .select('group_id')
        .eq('coach_id', user.id);
        
      if (groupCoachesError) {
        console.error('Error fetching group_coaches:', groupCoachesError);
        throw groupCoachesError;
      }
      
      console.log('Group coaches data:', groupCoaches);
      
      if (!groupCoaches || groupCoaches.length === 0) {
        console.log('No groups found for coach');
        
        // For debugging: Check all group_coaches entries to see if the coach exists with a different ID
        const { data: allGroupCoaches, error: allGroupCoachesError } = await supabase
          .from('group_coaches')
          .select('*');
          
        if (!allGroupCoachesError && allGroupCoaches) {
          console.log('All group coaches in the system:', allGroupCoaches);
        }
        
        return [];
      }
      
      // Get the actual group details
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupCoaches.map(gc => gc.group_id));
        
      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }
      
      console.log('Groups data:', groups);
      return groups || [];
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
