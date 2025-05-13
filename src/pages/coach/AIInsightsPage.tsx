import React, { useState } from 'react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Info, Users, User, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { fetchCoachGroups } from '@/services/coach-group-service';
import { fetchCoachClients } from '@/services/coach-clients-service';
import { supabase } from '@/integrations/supabase/client';

// Define interfaces for our data structures
interface ClientData {
  id: string;
  email: string | null;
  user_type: string;
  first_name: string | null;
  last_name: string | null;
  last_workout_at: string | null;
  total_workouts_completed: number;
  current_program_id: string | null;
  current_program_title: string | null;
  days_since_last_workout: number | null;
  group_ids: string[];
}

interface GroupData {
  id: string;
  name: string;
  description: string | null;
}

interface ClientInsightsData {
  totalWorkouts: number;
  recentWorkouts: any[];
  lastWorkout: string | null;
  streakData: {
    currentStreak: number;
    longestStreak: number;
  };
  insights: {
    type: string;
    title: string;
    message: string;
  }[];
}

interface GroupInsightsData {
  totalMembers: number;
  activeMembers: number;
  totalWorkouts: number;
  insights: {
    type: string;
    title: string;
    message: string;
  }[];
}

// Removed the local fetchCoachClients function as we're now using the imported one from coach-clients-service.ts

const AIInsightsPage = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('client');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Check if user is admin
  const { isAdmin } = useIsAdmin();

  // Fetch coach groups
  const { data: coachGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['coach-groups', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      console.log('Fetching groups for coach/admin:', user.id, 'Is admin:', isAdmin);
      return fetchCoachGroups(user.id, isAdmin);
    },
    enabled: !!user
  });

  // Fetch coach clients - now using the imported service function with isAdmin parameter
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['coach-clients', user?.id, isAdmin],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      console.log('Fetching clients for coach/admin:', user.id, 'Is admin:', isAdmin);
      
      // Use the imported service function with isAdmin parameter
      return fetchCoachClients(user.id, isAdmin);
    },
    enabled: !!user
  });

  // Fetch workout data for clients
  const { data: clientInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['client-insights', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;

      // Get workout completions for the client
      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .eq('user_id', selectedClientId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Here we would perform more sophisticated analysis 
      // based on completions, client profile, etc.
      // For now, we'll return simple data

      return {
        totalWorkouts: completions?.length || 0,
        recentWorkouts: completions?.slice(0, 5) || [],
        lastWorkout: completions?.[0]?.completed_at || null,
        streakData: {
          currentStreak: calculateStreak(completions),
          longestStreak: calculateLongestStreak(completions)
        },
        insights: generateClientInsights(completions)
      };
    },
    enabled: !!selectedClientId
  });

  // Fetch group data
  const { data: groupInsights, isLoading: groupInsightsLoading } = useQuery({
    queryKey: ['group-insights', selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return null;

      // Get members of the group
      const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', selectedGroupId);

      if (membersError) throw membersError;

      const memberIds = members?.map(m => m.user_id) || [];
      
      // Get workout completions for all members
      const { data: completions, error } = await supabase
        .from('workout_completions')
        .select('*')
        .in('user_id', memberIds)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Group completions by user
      const userCompletions: Record<string, any[]> = {};
      completions?.forEach(completion => {
        if (!userCompletions[completion.user_id]) {
          userCompletions[completion.user_id] = [];
        }
        userCompletions[completion.user_id].push(completion);
      });

      // Analyze group data
      const insights = generateGroupInsights(userCompletions, memberIds);
      
      return {
        totalMembers: memberIds.length,
        activeMembers: Object.keys(userCompletions).length,
        totalWorkouts: completions?.length || 0,
        insights
      };
    },
    enabled: !!selectedGroupId
  });

  // Filter clients based on search query
  const filteredClients = clients?.filter(client => 
    client.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions for insight generation
  const calculateStreak = (completions: any[] | null | undefined) => {
    if (!completions || completions.length === 0) return 0;
    
    // This is a simplified streak calculation
    // In a real implementation, consider date ranges and consistency
    return Math.min(completions.length, 7); // Simplified for demo
  };

  const calculateLongestStreak = (completions: any[] | null | undefined) => {
    if (!completions || completions.length === 0) return 0;
    
    // Simplified calculation for demo
    return Math.min(completions.length, 14);
  };

  const generateClientInsights = (completions: any[] | null | undefined) => {
    if (!completions || completions.length === 0) {
      return [{
        type: 'warning',
        title: 'No Activity',
        message: 'This client has no workout completions yet. Consider reaching out to help them get started.'
      }];
    }
    
    const insights = [];
    
    // Calculate days since last workout
    const lastWorkoutDate = new Date(completions[0].completed_at);
    const daysSinceLastWorkout = Math.floor((new Date().getTime() - lastWorkoutDate.getTime()) / (1000 * 3600 * 24));
    
    if (daysSinceLastWorkout > 5) {
      insights.push({
        type: 'warning',
        title: 'Engagement Drop',
        message: `It's been ${daysSinceLastWorkout} days since their last workout. Consider sending a check-in message.`
      });
    }
    
    // Check consistency
    if (completions.length >= 3) {
      insights.push({
        type: 'success',
        title: 'Consistent Progress',
        message: 'This client has completed multiple workouts recently. Acknowledge their consistency!'
      });
    }
    
    // Always add a coaching suggestion
    insights.push({
      type: 'info',
      title: 'Coaching Opportunity',
      message: 'Consider reviewing their recent workout notes for feedback they might have shared.'
    });
    
    return insights;
  };

  const generateGroupInsights = (userCompletions: Record<string, any[]>, memberIds: string[]) => {
    const insights = [];
    
    // Check group engagement
    const engagementRate = (Object.keys(userCompletions).length / memberIds.length) * 100;
    
    if (engagementRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Group Engagement',
        message: `Only ${engagementRate.toFixed(0)}% of group members have logged workouts. Consider a group challenge to increase engagement.`
      });
    } else if (engagementRate > 80) {
      insights.push({
        type: 'success',
        title: 'High Group Engagement',
        message: `${engagementRate.toFixed(0)}% of members are actively logging workouts. Great community momentum!`
      });
    }
    
    // Check for active members
    const activeMemberCount = Object.keys(userCompletions).length;
    
    if (activeMemberCount >= 3) {
      insights.push({
        type: 'info',
        title: 'Community Building',
        message: 'Consider highlighting top performers to motivate the group.'
      });
    }
    
    // Always add a coaching suggestion
    insights.push({
      type: 'info',
      title: 'Group Challenge Opportunity',
      message: 'Consider setting a group goal or challenge to boost motivation and community.'
    });
    
    return insights;
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const renderClientList = () => {
    if (clientsLoading) {
      return (
        <div className="flex justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (!filteredClients || filteredClients.length === 0) {
      return (
        <div className="text-center p-4 text-muted-foreground">
          {searchQuery ? 'No clients match your search' : 'No clients found'}
        </div>
      );
    }
    
    return (
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => handleClientSelect(client.id)}
            className={`p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors ${
              selectedClientId === client.id ? 'bg-accent border-primary/50' : ''
            }`}
          >
            <div className="font-medium">
              {client.first_name ? `${client.first_name} ${client.last_name ? client.last_name.charAt(0) + '.' : ''}` : client.email}
            </div>
            <div className="text-sm text-muted-foreground flex justify-between">
              <span>{client.total_workouts_completed || 0} workouts completed</span>
              {client.current_program_title && (
                <span className="text-coach">{client.current_program_title}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Insights</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered insights to help you coach more effectively.
          </p>
        </div>

        <Tabs 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Client-Level Insights
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Group-Level Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="client" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select a Client</CardTitle>
                <CardDescription>
                  Find a client to view personalized insights and coaching opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search clients by email"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  {renderClientList()}
                </div>
              </CardContent>
            </Card>
            
            {selectedClientId && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Client Insights
                    {insightsLoading && <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    AI-generated insights based on workout history and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {insightsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : clientInsights ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Total Workouts</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{clientInsights.totalWorkouts}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Current Streak</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{clientInsights.streakData.currentStreak} days</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Last Active</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xl font-medium">
                              {clientInsights.lastWorkout 
                                ? new Date(clientInsights.lastWorkout).toLocaleDateString() 
                                : 'Never'}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Coaching Opportunities</h3>
                        <div className="space-y-3">
                          {clientInsights.insights.map((insight, index) => (
                            <Alert key={index} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                              <Info className="h-4 w-4" />
                              <AlertTitle>{insight.title}</AlertTitle>
                              <AlertDescription>
                                {insight.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                        {clientInsights.recentWorkouts.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {clientInsights.recentWorkouts.map((workout, index) => (
                              <div key={index} className="p-2 border rounded-md">
                                <div className="font-medium">
                                  {workout.title || 'Workout'}
                                  {workout.workout_type && (
                                    <Badge className="ml-2" variant="outline">
                                      {workout.workout_type}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(workout.completed_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">No recent activity</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      Select a client to view insights
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="group" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select a Group</CardTitle>
                <CardDescription>
                  Choose a group to view aggregated insights and trends.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {groupsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : coachGroups && coachGroups.length > 0 ? (
                  <Select onValueChange={handleGroupSelect} value={selectedGroupId || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {coachGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No groups found
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedGroupId && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Group Insights
                    {groupInsightsLoading && <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    AI-generated insights for group trends and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groupInsightsLoading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : groupInsights ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Total Members</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{groupInsights.totalMembers}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Active Members</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{groupInsights.activeMembers}</div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round((groupInsights.activeMembers / groupInsights.totalMembers) * 100)}% engaged
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-lg">Total Workouts</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold">{groupInsights.totalWorkouts}</div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Group Coaching Opportunities</h3>
                        <div className="space-y-3">
                          {groupInsights.insights.map((insight, index) => (
                            <Alert key={index} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                              <Info className="h-4 w-4" />
                              <AlertTitle>{insight.title}</AlertTitle>
                              <AlertDescription>
                                {insight.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button>
                          Message Group
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4 text-muted-foreground">
                      Select a group to view insights
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </CoachLayout>
  );
};

export default AIInsightsPage;
