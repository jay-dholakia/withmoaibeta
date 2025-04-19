import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, UserSquare, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Filter, CalendarDays } from 'lucide-react';
import { fetchAllClients } from '@/services/workout-service';
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
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks';

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

const ClientStatsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all'); // 'all', 'active', 'inactive'

  const { 
    data: clients, 
    isLoading: isLoadingClients, 
    refetch: refetchClients 
  } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchAllClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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
    refetchClients();
    refetchStats();
  };

  const combinedData: ClientStats[] = useMemo(() => {
    if (!clients || !clientStats) return [];
    
    return clients.map(client => {
      const stats = clientStats.find(stat => stat.id === client.id) || {
        groups: [],
        last_workout_date: null,
        assigned_workouts_this_week: 0,
        activities_this_week: 0,
        total_activities: 0
      };
      
      return {
        id: client.id,
        email: client.email,
        first_name: client.first_name || null,
        last_name: client.last_name || null,
        groups: stats.groups || [],
        last_workout_date: stats.last_workout_date,
        assigned_workouts_this_week: stats.assigned_workouts_this_week || 0,
        activities_this_week: stats.activities_this_week || 0,
        total_activities: stats.total_activities || 0
      };
    });
  }, [clients, clientStats]);

  const allGroups = useMemo(() => {
    if (!combinedData) return [];
    
    const groupSet = new Set<string>();
    combinedData.forEach(client => {
      client.groups.forEach(group => groupSet.add(group.name));
    });
    
    return Array.from(groupSet);
  }, [combinedData]);

  const handleSearchChange = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-1 h-4 w-4" /> 
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const toggleGroupFilter = (groupName: string) => {
    setGroupFilter(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName) 
        : [...prev, groupName]
    );
  };

  const isWorkoutStale = (lastWorkoutDate: string | null) => {
    if (!lastWorkoutDate) return false;
    const date = new Date(lastWorkoutDate);
    if (!isValid(date)) return false;
    
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return date < twoDaysAgo;
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = [...combinedData];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(client => 
        client.email.toLowerCase().includes(query) || 
        (client.first_name && client.first_name.toLowerCase().includes(query)) ||
        (client.last_name && client.last_name.toLowerCase().includes(query))
      );
    }
    
    if (groupFilter.length > 0) {
      result = result.filter(client => 
        client.groups.some(group => groupFilter.includes(group.name))
      );
    }
    
    if (activityFilter !== 'all') {
      result = result.filter(client => {
        const isActive = client.last_workout_date && 
          new Date(client.last_workout_date) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 2 weeks
        
        return activityFilter === 'active' ? isActive : !isActive;
      });
    }
    
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    
    return format(date, "MMM d, yyyy");
  };

  const weekDateRange = useMemo(() => {
    const now = new Date();
    const todayPT = formatInTimeZone(now, 'America/Los_Angeles', 'yyyy-MM-dd');
    const datePT = new Date(todayPT + 'T00:00:00');
    
    const dayOfWeek = datePT.getDay(); 
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startOfWeekPT = new Date(datePT);
    startOfWeekPT.setDate(datePT.getDate() - daysFromMonday);
    
    const endOfWeekPT = new Date(startOfWeekPT);
    endOfWeekPT.setDate(startOfWeekPT.getDate() + 6);
    
    return {
      start: format(startOfWeekPT, 'MMM d, yyyy'),
      end: format(endOfWeekPT, 'MMM d, yyyy')
    };
  }, []);

  const isMobile = useIsMobile();

  const formatDisplayName = (firstName: string | null, lastName: string | null, email: string): string => {
    if (!firstName) return email;
    return `${firstName} ${lastName ? lastName.charAt(0) + '.' : ''}`.trim();
  };

  return (
    <AdminDashboardLayout title="Client Statistics">
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

        <div className="rounded-md border">
          <div className="bg-muted/50 px-4 py-2.5 flex items-center border-b">
            <CalendarDays className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Current Week: {weekDateRange.start} - {weekDateRange.end} (Pacific Time)
            </span>
          </div>
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
                {!isMobile && (
                  <TableHead>
                    <div className="flex items-center">
                      <UserSquare className="h-4 w-4 mr-1" />
                      Groups
                    </div>
                  </TableHead>
                )}
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
                {!isMobile && (
                  <>
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
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClients || isLoadingStats ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    {Array.from({ length: isMobile ? 2 : 6 }).map((_, cellIndex) => (
                      <TableCell key={`loading-cell-${index}-${cellIndex}`}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAndSortedClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isMobile ? 2 : 6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatDisplayName(client.first_name, client.last_name, client.email)}
                        </div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                      </div>
                    </TableCell>
                    {!isMobile && (
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
                    )}
                    <TableCell className={cn(
                      isWorkoutStale(client.last_workout_date) && "text-red-500 font-medium"
                    )}>
                      {formatDate(client.last_workout_date)}
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell>{client.assigned_workouts_this_week}</TableCell>
                        <TableCell>{client.activities_this_week}</TableCell>
                        <TableCell>{client.total_activities}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default ClientStatsPage;
