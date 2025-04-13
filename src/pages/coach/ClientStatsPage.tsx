
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { RefreshCw, Search, UserSquare, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { fetchClientWorkoutStats } from '@/services/admin-client-stats-service';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { debounce } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { fetchCoachClients } from '@/services/coach-clients-service';

interface ClientStats {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  groups: { id: string; name: string }[];
  last_workout_date: string | null;
  assigned_workouts_this_week: number;
  activities_this_week: number;
  total_activities: number;
}

type SortField = 'name' | 'lastWorkout' | 'assignedWorkouts' | 'activitiesWeek' | 'totalActivities';
type SortDirection = 'asc' | 'desc';

const CoachClientStatsPage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all'); // 'all', 'active', 'inactive'

  // Fetch coach's clients
  const { 
    data: coachClients, 
    isLoading: isLoadingCoachClients,
    refetch: refetchCoachClients
  } = useQuery({
    queryKey: ['coach-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return fetchCoachClients(user.id);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch workout stats for all clients
  const {
    data: clientStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['client-stats'],
    queryFn: fetchClientWorkoutStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleRefresh = () => {
    refetchCoachClients();
    refetchStats();
  };

  // Get client IDs that the coach has access to
  const coachClientIds = useMemo(() => {
    return coachClients?.map(client => client.id) || [];
  }, [coachClients]);

  // Combine client data with stats, filtering to only include coach's clients
  const combinedData: ClientStats[] = useMemo(() => {
    if (!clientStats) return [];
    
    // Filter stats to only include clients that the coach has access to
    return clientStats
      .filter(stat => coachClientIds.includes(stat.id))
      .map(stat => {
        const clientInfo = coachClients?.find(client => client.id === stat.id);
        
        return {
          id: stat.id,
          email: clientInfo?.email || 'Unknown',
          first_name: null, // We'll need to fetch this separately if needed
          last_name: null,  // We'll need to fetch this separately if needed
          groups: stat.groups || [],
          last_workout_date: stat.last_workout_date,
          assigned_workouts_this_week: stat.assigned_workouts_this_week || 0,
          activities_this_week: stat.activities_this_week || 0,
          total_activities: stat.total_activities || 0
        };
      });
  }, [clientStats, coachClientIds, coachClients]);

  // Extract all unique group names for the filter dropdown
  const allGroups = useMemo(() => {
    if (!combinedData) return [];
    
    const groupSet = new Set<string>();
    combinedData.forEach(client => {
      client.groups.forEach(group => groupSet.add(group.name));
    });
    
    return Array.from(groupSet);
  }, [combinedData]);

  // Handle search input with debounce
  const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);

  // Handle sort toggle for a column
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator icon for a column
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4" /> 
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Toggle group filter
  const toggleGroupFilter = (groupName: string) => {
    setGroupFilter(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    );
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let result = [...combinedData];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => 
        client.email.toLowerCase().includes(query) || 
        (client.first_name && client.first_name.toLowerCase().includes(query)) ||
        (client.last_name && client.last_name.toLowerCase().includes(query))
      );
    }
    
    // Apply group filter
    if (groupFilter.length > 0) {
      result = result.filter(client => 
        client.groups.some(group => groupFilter.includes(group.name))
      );
    }
    
    // Apply activity filter
    if (activityFilter !== 'all') {
      result = result.filter(client => {
        const isActive = client.last_workout_date && 
          new Date(client.last_workout_date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 2 weeks
        
        return activityFilter === 'active' ? isActive : !isActive;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.email;
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.email;
          comparison = nameA.localeCompare(nameB);
          break;
          
        case 'lastWorkout':
          const dateA = a.last_workout_date ? new Date(a.last_workout_date).getTime() : 0;
          const dateB = b.last_workout_date ? new Date(b.last_workout_date).getTime() : 0;
          comparison = dateA - dateB;
          break;
          
        case 'assignedWorkouts':
          comparison = a.assigned_workouts_this_week - b.assigned_workouts_this_week;
          break;
          
        case 'activitiesWeek':
          comparison = a.activities_this_week - b.activities_this_week;
          break;
          
        case 'totalActivities':
          comparison = a.total_activities - b.total_activities;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [combinedData, searchQuery, sortField, sortDirection, groupFilter, activityFilter]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    
    return format(date, "MMM d, yyyy");
  };

  const isLoading = isLoadingCoachClients || isLoadingStats;

  return (
    <CoachLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-coach">Client Statistics</h1>
        
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                onChange={handleSearchChange}
                defaultValue={searchQuery}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    Activity
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuCheckboxItem
                    checked={activityFilter === 'all'}
                    onCheckedChange={() => setActivityFilter('all')}
                  >
                    All Clients
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activityFilter === 'active'}
                    onCheckedChange={() => setActivityFilter('active')}
                  >
                    Active (last 2 weeks)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activityFilter === 'inactive'}
                    onCheckedChange={() => setActivityFilter('inactive')}
                  >
                    Inactive
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <UserSquare className="h-4 w-4" />
                    Groups {groupFilter.length > 0 && `(${groupFilter.length})`}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  {allGroups.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No groups found</div>
                  ) : (
                    allGroups.map(groupName => (
                      <DropdownMenuCheckboxItem
                        key={groupName}
                        checked={groupFilter.includes(groupName)}
                        onCheckedChange={() => toggleGroupFilter(groupName)}
                      >
                        {groupName}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Activity</CardTitle>
              <CardDescription>
                Statistics for clients in your coaching groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSort('name')}
                      >
                        <div className="flex items-center">
                          Client
                          {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <UserSquare className="h-4 w-4 mr-1" />
                          Groups
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSort('lastWorkout')}
                      >
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Last Workout
                          {getSortIcon('lastWorkout')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSort('assignedWorkouts')}
                      >
                        <div className="flex items-center">
                          This Week's Workouts
                          {getSortIcon('assignedWorkouts')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSort('activitiesWeek')}
                      >
                        <div className="flex items-center">
                          This Week's Activities
                          {getSortIcon('activitiesWeek')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => toggleSort('totalActivities')}
                      >
                        <div className="flex items-center">
                          Total Activities
                          {getSortIcon('totalActivities')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Loading state
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                          {Array.from({ length: 6 }).map((_, cellIndex) => (
                            <TableCell key={`loading-cell-${index}-${cellIndex}`}>
                              <Skeleton className="h-5 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredAndSortedClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No clients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {client.first_name && client.last_name
                                  ? `${client.first_name} ${client.last_name}`
                                  : client.email}
                              </div>
                              {client.first_name && client.last_name && (
                                <div className="text-sm text-muted-foreground">{client.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.groups.length === 0 ? (
                                <span className="text-muted-foreground text-sm">None</span>
                              ) : (
                                client.groups.map((group) => (
                                  <Badge key={group.id} variant="outline" className="bg-muted/30">
                                    {group.name}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(client.last_workout_date)}
                          </TableCell>
                          <TableCell>
                            {client.assigned_workouts_this_week}
                          </TableCell>
                          <TableCell>
                            {client.activities_this_week}
                          </TableCell>
                          <TableCell>
                            {client.total_activities}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CoachLayout>
  );
};

export default CoachClientStatsPage;
