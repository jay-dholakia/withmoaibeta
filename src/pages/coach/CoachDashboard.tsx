
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Dumbbell, BarChart3, Award, Heart, FileText } from 'lucide-react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CoachDashboard = () => {
  const { user, userType, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('groups');

  const { data: coachGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Get groups the coach is assigned to
      const { data: groupCoaches, error: groupCoachesError } = await supabase
        .from('group_coaches')
        .select('group_id')
        .eq('coach_id', user.id);
        
      if (groupCoachesError) throw groupCoachesError;
      
      if (groupCoaches.length === 0) return [];
      
      // Get the actual group details
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupCoaches.map(gc => gc.group_id));
        
      if (groupsError) throw groupsError;
      
      return groups;
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
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-coach mb-6">Coach Dashboard</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-8">
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">My Groups</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Workout Programs</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboards" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboards</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Health Metrics</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Coach Bio</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="groups" className="space-y-4">
            <h2 className="text-xl font-semibold">My Groups and Clients</h2>
            <p className="text-muted-foreground mb-4">View and manage the groups and clients assigned to you.</p>
            
            {groupsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-coach" />
              </div>
            ) : coachGroups?.length ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coachGroups.map(group => (
                  <div key={group.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-lg">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">{group.description || 'No description'}</p>
                    <button 
                      className="mt-3 text-sm text-coach hover:underline"
                      onClick={() => toast.info('Group details coming soon!')}
                    >
                      View Members
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <p>You haven't been assigned to any groups yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="workouts">
            <h2 className="text-xl font-semibold">Workout Programs</h2>
            <p className="text-muted-foreground mb-4">Design workout programs for your clients.</p>
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p>Workout program builder coming soon!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            <p className="text-muted-foreground mb-4">Monitor your clients' workout frequency and performance.</p>
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p>Performance analytics dashboard coming soon!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="leaderboards">
            <h2 className="text-xl font-semibold">Group Leaderboards</h2>
            <p className="text-muted-foreground mb-4">Compare workout consistency across groups.</p>
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p>Leaderboard functionality coming soon!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="health">
            <h2 className="text-xl font-semibold">Client Health Metrics</h2>
            <p className="text-muted-foreground mb-4">Track and analyze health and fitness metrics.</p>
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p>Health metrics tracking coming soon!</p>
            </div>
          </TabsContent>
          
          <TabsContent value="profile">
            <h2 className="text-xl font-semibold">Coach Bio</h2>
            <p className="text-muted-foreground mb-4">Write your professional bio for clients to view.</p>
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <p>Coach bio editor coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
};

export default CoachDashboard;
