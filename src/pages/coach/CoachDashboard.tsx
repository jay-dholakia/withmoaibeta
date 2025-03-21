import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Dumbbell, BarChart3, Award, Heart, FileText, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WorkoutProgramList } from '@/components/coach/WorkoutProgramList';
import { fetchWorkoutPrograms } from '@/services/workout-service';
import { Card } from '@/components/ui/card';
import { 
  fetchCoachGroups, 
  fixCoachGroupAssignment, 
  fetchAllGroups,
  createGroupForCoach,
  syncCoachEmailWithGroups
} from '@/services/coach-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';

const CoachDashboard = () => {
  const { user, userType, loading } = useAuth();
  const navigate = useNavigate();
  const [isFixingAssignment, setIsFixingAssignment] = useState(false);
  const [isSyncingGroups, setIsSyncingGroups] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<{
    allGroups: any[];
    availableGroups: any[];
  } | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: ''
  });
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (user) {
      console.log('Coach dashboard mounted for user:', user.id, 'with type:', userType);
      
      const fetchUserEmail = async () => {
        try {
          setUserEmail(user.email || '');
          console.log('User email:', user.email);
        } catch (error) {
          console.error('Error fetching user email:', error);
        }
      };
      
      fetchUserEmail();
    }
  }, [user, userType]);

  const { data: coachGroups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      console.log('Using coach service to fetch groups for coach ID:', user.id);
      try {
        const groups = await fetchCoachGroups(user.id);
        
        if (!groups || groups.length === 0) {
          console.log('No groups found from service, checking all groups');
          
          try {
            const allGroups = await fetchAllGroups();
            console.log('All available groups in the system:', allGroups);
            
            setDiagnosticInfo({
              allGroups: allGroups || [],
              availableGroups: allGroups || []
            });
          } catch (error) {
            console.error('Error fetching diagnostic information:', error);
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

  const handleFixAssignment = async (groupId: string) => {
    if (!user) return;
    
    setIsFixingAssignment(true);
    try {
      const result = await fixCoachGroupAssignment(user.id, groupId);
      
      if (result) {
        toast.success('Group assignment fixed successfully!');
        refetchGroups();
      } else {
        toast.error('Failed to fix group assignment');
      }
    } catch (error) {
      console.error('Error trying to fix assignment:', error);
      toast.error('An unexpected error occurred while fixing assignment');
    } finally {
      setIsFixingAssignment(false);
    }
  };

  const handleSyncGroups = async () => {
    if (!user) return;
    
    setIsSyncingGroups(true);
    try {
      const result = await syncCoachEmailWithGroups();
      
      if (result.success) {
        toast.success(result.message);
        refetchGroups();
      } else {
        toast.error(`Failed to sync groups: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing coach groups:', error);
      toast.error('An unexpected error occurred while syncing groups');
    } finally {
      setIsSyncingGroups(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    setIsCreatingGroup(true);
    try {
      const result = await createGroupForCoach(
        user.id, 
        newGroup.name.trim(),
        newGroup.description.trim()
      );
      
      if (result.success) {
        toast.success('Group created successfully!');
        setNewGroup({ name: '', description: '' });
        refetchGroups();
      } else {
        toast.error('Failed to create group: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('An unexpected error occurred while creating group');
    } finally {
      setIsCreatingGroup(false);
    }
  };

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
              <div className="flex justify-center gap-2 mt-3">
                <Button 
                  variant="outline" 
                  onClick={() => refetchGroups()}
                  disabled={groupsLoading}
                  className="flex gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${groupsLoading ? 'animate-spin' : ''}`} />
                  Refresh Groups
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                >
                  {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                </Button>
              </div>
              
              {showDiagnostics && (
                <div className="mt-4 text-left">
                  <Tabs defaultValue="diagnostic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="diagnostic">Diagnostics</TabsTrigger>
                      <TabsTrigger value="sync">Sync Groups</TabsTrigger>
                      <TabsTrigger value="create">Create Group</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="diagnostic">
                      <Alert className="mb-2">
                        <AlertTitle className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Diagnostic Information
                        </AlertTitle>
                        <AlertDescription className="space-y-2">
                          <div>
                            <p>Your Coach ID: <span className="font-mono text-xs bg-muted p-1 rounded">{user?.id}</span></p>
                            {userEmail && (
                              <p>Your Email: <span className="font-mono text-xs bg-muted p-1 rounded">{userEmail}</span></p>
                            )}
                          </div>
                          {userEmail === 'jdholakia12@gmail.com' && (
                            <p className="text-sm text-muted-foreground mt-2">
                              You are using a special account that should have access to Moai groups.
                            </p>
                          )}
                        </AlertDescription>
                      </Alert>
                      
                      {diagnosticInfo && diagnosticInfo.allGroups.length > 0 ? (
                        <>
                          <p className="text-sm mb-2 font-semibold">Available Groups:</p>
                          <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-muted/40 rounded-md">
                            {diagnosticInfo.allGroups.map(group => (
                              <div key={group.id} className="border bg-card p-2 rounded-md flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">{group.name}</p>
                                  <p className="text-xs text-muted-foreground">{group.id}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleFixAssignment(group.id)}
                                  disabled={isFixingAssignment}
                                >
                                  {isFixingAssignment ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Fix Assignment'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No groups found in the system.</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="sync">
                      <p className="text-sm mb-4">
                        If you're having trouble with group assignments, try syncing your email with the groups:
                      </p>
                      
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Email-Group Sync</AlertTitle>
                          <AlertDescription>
                            This will ensure that your account has the correct group assignments based on your email.
                            {userEmail === 'jdholakia12@gmail.com' && (
                              <p className="text-sm font-medium mt-1">
                                For jdholakia12@gmail.com, this will make sure you have access to Moai groups.
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                        
                        <Button 
                          className="w-full"
                          onClick={handleSyncGroups}
                          disabled={isSyncingGroups}
                        >
                          {isSyncingGroups ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                          Sync Group Assignments
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="create">
                      <p className="text-sm mb-4">
                        You can create your own group and automatically be assigned to it:
                      </p>
                      
                      <div className="space-y-4">
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="group-name">Group Name</Label>
                          <Input 
                            id="group-name" 
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                            placeholder="Enter group name" 
                          />
                        </div>
                        
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="group-description">Description (Optional)</Label>
                          <Textarea 
                            id="group-description" 
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                            placeholder="Enter group description" 
                            rows={3}
                          />
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={handleCreateGroup}
                          disabled={isCreatingGroup || !newGroup.name.trim()}
                        >
                          {isCreatingGroup ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                          Create Group
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>If this issue persists, please contact the admin.</p>
                  </div>
                </div>
              )}
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
