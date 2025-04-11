
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, UserSquare, Calendar } from 'lucide-react';
import { fetchAllClients } from '@/services/workout-service';
import { fetchClientWorkoutStats } from '@/services/admin-client-stats-service';
import { format, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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

const ClientStatsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

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

  // Combine client data with stats
  const combinedData: ClientStats[] = React.useMemo(() => {
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

  // Filter clients based on search
  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return combinedData;
    
    const query = searchQuery.toLowerCase();
    return combinedData.filter(client => 
      client.email.toLowerCase().includes(query) || 
      (client.first_name && client.first_name.toLowerCase().includes(query)) ||
      (client.last_name && client.last_name.toLowerCase().includes(query))
    );
  }, [combinedData, searchQuery]);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    
    return format(date, "MMM d, yyyy");
  };

  return (
    <AdminDashboardLayout title="Client Statistics">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <UserSquare className="h-4 w-4 mr-1" />
                    Groups
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Last Workout
                  </div>
                </TableHead>
                <TableHead>This Week's Workouts</TableHead>
                <TableHead>This Week's Activities</TableHead>
                <TableHead>Total Activities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingClients || isLoadingStats ? (
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
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
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
      </div>
    </AdminDashboardLayout>
  );
};

export default ClientStatsPage;
