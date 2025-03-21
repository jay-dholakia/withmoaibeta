
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Filter, Calendar, Clock, Award, Info } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ClientData, GroupData, fetchCoachClients, fetchCoachGroups } from '@/services/client-service';
import { ClientDetailView } from '@/components/coach/ClientDetailView';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

const ClientsPage = () => {
  const { user } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: clients, isLoading: isLoadingClients } = useQuery({
    queryKey: ['coach-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchCoachClients(user.id);
    },
    enabled: !!user?.id,
  });

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchCoachGroups(user.id);
    },
    enabled: !!user?.id,
  });

  const filteredClients = clients?.filter(client => 
    selectedGroupId === 'all' || client.group_ids.includes(selectedGroupId)
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil((filteredClients?.length || 0) / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleCloseClientView = () => {
    setSelectedClientId(null);
  };

  const getWorkoutStatusClass = (days: number | null) => {
    if (days === null) return "text-gray-500";
    if (days === 0) return "text-green-600 font-medium";
    if (days <= 2) return "text-green-500";
    if (days <= 7) return "text-yellow-500";
    return "text-red-500 font-medium";
  };

  const getWorkoutStatusText = (days: number | null) => {
    if (days === null) return "Never logged";
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  if (isLoadingClients || isLoadingGroups) {
    return (
      <CoachLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-coach" />
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-coach flex items-center gap-2">
            <Users className="h-8 w-8" /> Clients
          </h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground mr-2">Filter by group:</span>
              <Select value={selectedGroupId} onValueChange={(value) => {
                setSelectedGroupId(value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups?.map((group: GroupData) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
            <CardDescription>
              {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'} 
              {selectedGroupId !== 'all' && groups ? 
                ` in ${groups.find(g => g.id === selectedGroupId)?.name}` : 
                ' across all your groups'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <p>No clients found with the current filter.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Last Workout</TableHead>
                        <TableHead>Total Workouts</TableHead>
                        <TableHead>Current Program</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">{client.email}</TableCell>
                          <TableCell>
                            <span className={getWorkoutStatusClass(client.days_since_last_workout)}>
                              {getWorkoutStatusText(client.days_since_last_workout)}
                            </span>
                          </TableCell>
                          <TableCell>{client.total_workouts_completed}</TableCell>
                          <TableCell>
                            {client.current_program_title ? (
                              <span className="text-coach">{client.current_program_title}</span>
                            ) : (
                              <span className="text-muted-foreground">No active program</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewClient(client.id)}
                                >
                                  <Info className="h-4 w-4 mr-1" /> View Details
                                </Button>
                              </SheetTrigger>
                              <SheetContent className="sm:max-w-md md:max-w-lg">
                                {selectedClientId === client.id && (
                                  <ClientDetailView 
                                    clientId={client.id} 
                                    clientEmail={client.email}
                                    onClose={handleCloseClientView} 
                                  />
                                )}
                              </SheetContent>
                            </Sheet>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              isActive={currentPage === page}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default ClientsPage;
