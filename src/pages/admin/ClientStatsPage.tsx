
import React, { useState, useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, Search, FilterIcon, ArrowUpDown } from 'lucide-react';
import { fetchAllClients } from '@/services/program-service';
import { Badge } from '@/components/ui/badge';

const ClientStatsPage = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('last_workout');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterWorkouts, setFilterWorkouts] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAllClients();
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredClients = React.useMemo(() => {
    let filtered = [...clients];
    
    // Apply search filter
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.email?.toLowerCase().includes(lowercasedSearch) ||
        client.first_name?.toLowerCase().includes(lowercasedSearch) ||
        client.last_name?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Apply workout count filter
    if (filterWorkouts === 'active') {
      filtered = filtered.filter(client => 
        client.total_workouts_completed > 0
      );
    } else if (filterWorkouts === 'inactive') {
      filtered = filtered.filter(client => 
        client.total_workouts_completed === 0
      );
    } else if (filterWorkouts === 'new') {
      filtered = filtered.filter(client => 
        !client.last_workout_at
      );
    }
    
    return filtered;
  }, [clients, searchTerm, filterWorkouts]);
  
  const sortedClients = React.useMemo(() => {
    let sorted = [...filteredClients];
    
    switch(sortField) {
      case 'name':
        sorted.sort((a, b) => {
          const nameA = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          const nameB = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          return sortDirection === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
        break;
      case 'email':
        sorted.sort((a, b) => {
          return sortDirection === 'asc'
            ? a.email.localeCompare(b.email)
            : b.email.localeCompare(a.email);
        });
        break;
      case 'workouts':
        sorted.sort((a, b) => {
          const countA = a.total_workouts_completed || 0;
          const countB = b.total_workouts_completed || 0;
          return sortDirection === 'asc' ? countA - countB : countB - countA;
        });
        break;
      case 'last_workout':
      default:
        sorted.sort((a, b) => {
          // Handle nulls for last_workout_at
          if (!a.last_workout_at && !b.last_workout_at) return 0;
          if (!a.last_workout_at) return sortDirection === 'asc' ? -1 : 1;
          if (!b.last_workout_at) return sortDirection === 'asc' ? 1 : -1;
          
          const dateA = new Date(a.last_workout_at).getTime();
          const dateB = new Date(b.last_workout_at).getTime();
          return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }
    
    return sorted;
  }, [filteredClients, sortField, sortDirection]);
  
  const getLastWorkoutText = React.useMemo(() => {
    return (lastWorkoutAt: string | null) => {
      if (!lastWorkoutAt) return 'Never';
      
      const lastWorkout = new Date(lastWorkoutAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastWorkout.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    };
  }, []);
  
  return (
    <AdminDashboardLayout title="Client Statistics">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 pb-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <FilterIcon className="h-4 w-4 mr-1" />
                  {filterWorkouts === 'active' && "Active Clients"}
                  {filterWorkouts === 'inactive' && "Inactive Clients"}
                  {filterWorkouts === 'new' && "New Clients"}
                  {filterWorkouts === null && "All Clients"}
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterWorkouts(null)}>
                  All Clients
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterWorkouts('active')}>
                  Active Clients
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterWorkouts('inactive')}>
                  Inactive Clients
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterWorkouts('new')}>
                  New Clients
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Loading client data...</div>
        ) : sortedClients.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('workouts')}
                  >
                    <div className="flex items-center justify-end">
                      Workouts
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="text-right cursor-pointer"
                    onClick={() => handleSort('last_workout')}
                  >
                    <div className="flex items-center justify-end">
                      Last Activity
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        {`${client.first_name || ''} ${client.last_name || ''}`.trim() || 
                          <span className="text-muted-foreground italic">No name</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.email}
                      {!client.last_workout_at && 
                        <Badge variant="outline" className="ml-2 bg-muted text-xs">
                          New
                        </Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      {client.total_workouts_completed || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {getLastWorkoutText(client.last_workout_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            No clients found matching your criteria
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default ClientStatsPage;
