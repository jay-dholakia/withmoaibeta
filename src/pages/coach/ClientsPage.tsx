import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CoachLayout } from '@/layouts/CoachLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Users, Filter, ArrowUp, ArrowDown, CheckCircle2, Pencil, Send, Info } from 'lucide-react';
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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { fetchCoachClients } from '@/services/coach-clients-service';
import { fetchCoachGroups } from '@/services/coach-group-service';
import { ClientDetailView } from '@/components/coach/ClientDetailView';
import ClientMessageForm from '@/components/coach/ClientMessageForm';
import { toast } from 'sonner';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { fetchCoachMessagesForClient } from '@/services/coach-client-message-service';

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string;
}

interface MessageStatus {
  hasMessage: boolean;
  message?: {
    id: string;
    message: string;
    weekOf: string;
  };
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const ClientsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'message'>('details');
  const [messageStatus, setMessageStatus] = useState<Record<string, MessageStatus>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editMessage, setEditMessage] = useState<{id: string; message: string; weekOf: string} | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: 'asc' });
  const itemsPerPage = 10;

  const { data: clients, isLoading: isLoadingClients, error: clientsError } = useQuery({
    queryKey: ['coach-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      try {
        console.log('Fetching clients for coach:', user.id);
        const clientData = await fetchCoachClients(user.id);
        console.log('Fetched clients:', clientData);
        return clientData;
      } catch (error) {
        console.error('Error in client fetch query function:', error);
        toast.error('Failed to load clients. Please try again later.');
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: groups, isLoading: isLoadingGroups, error: groupsError } = useQuery({
    queryKey: ['coach-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      try {
        console.log('Fetching groups for coach:', user.id);
        const groupData = await fetchCoachGroups(user.id);
        console.log('Fetched groups:', groupData);
        return groupData;
      } catch (error) {
        console.error('Error in group fetch query function:', error);
        toast.error('Failed to load groups. Please try again later.');
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedData = (data: any[]) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === 'email') {
        return sortConfig.direction === 'asc' 
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
      if (sortConfig.key === 'last_workout') {
        const aValue = a.days_since_last_workout ?? Infinity;
        const bValue = b.days_since_last_workout ?? Infinity;
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      if (sortConfig.key === 'total_workouts') {
        return sortConfig.direction === 'asc'
          ? a.total_workouts_completed - b.total_workouts_completed
          : b.total_workouts_completed - a.total_workouts_completed;
      }
      if (sortConfig.key === 'program') {
        const aProgram = a.current_program_title || '';
        const bProgram = b.current_program_title || '';
        return sortConfig.direction === 'asc'
          ? aProgram.localeCompare(bProgram)
          : bProgram.localeCompare(aProgram);
      }
      return 0;
    });
  };

  const filteredClients = clients?.filter(client => 
    selectedGroupId === 'all' || client.group_ids.includes(selectedGroupId)
  ) || [];

  const sortedAndFilteredClients = getSortedData(filteredClients);

  const totalPages = Math.ceil((sortedAndFilteredClients?.length || 0) / itemsPerPage);
  const paginatedClients = sortedAndFilteredClients.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const messageStatusQuery = useQuery({
    queryKey: ['client-message-status', user?.id, filteredClients, currentPage],
    queryFn: async () => {
      if (!user?.id || !filteredClients.length) return {};
      
      const currentWeekDate = new Date();
      const day = currentWeekDate.getDay(); // 0 is Sunday
      const diff = currentWeekDate.getDate() - day;
      currentWeekDate.setDate(diff); // Set to this week's Sunday
      
      const statusObj: Record<string, MessageStatus> = {};
      
      for (const client of paginatedClients) {
        try {
          const messages = await fetchCoachMessagesForClient(user.id, client.id);
          const thisWeekMessage = messages.find(message => 
            new Date(message.week_of).toDateString() === currentWeekDate.toDateString()
          );
          
          if (thisWeekMessage) {
            statusObj[client.id] = {
              hasMessage: true,
              message: {
                id: thisWeekMessage.id,
                message: thisWeekMessage.message,
                weekOf: thisWeekMessage.week_of
              }
            };
          } else {
            statusObj[client.id] = { hasMessage: false };
          }
        } catch (error) {
          console.error(`Error checking message status for client ${client.id}:`, error);
          statusObj[client.id] = { hasMessage: false };
        }
      }
      
      setMessageStatus(statusObj);
      return statusObj;
    },
    enabled: !!user?.id && !!clients?.length,
  });

  const handleViewClient = (clientId: string, clientEmail: string) => {
    setSelectedClientId(clientId);
    setSelectedClientEmail(clientEmail);
    setActiveTab('details');
    setEditMessage(undefined);
    setSheetOpen(true);
  };

  const handleMessageClient = (clientId: string, clientEmail: string) => {
    setSelectedClientId(clientId);
    setSelectedClientEmail(clientEmail);
    setActiveTab('message');
    setEditMessage(undefined);
    setSheetOpen(true);
  };

  const handleEditMessage = (clientId: string, clientEmail: string) => {
    if (messageStatus[clientId]?.message) {
      setSelectedClientId(clientId);
      setSelectedClientEmail(clientEmail);
      setActiveTab('message');
      setEditMessage(messageStatus[clientId].message);
      setSheetOpen(true);
    } else {
      toast.error("No message found to edit");
    }
  };

  const handleCloseClientView = () => {
    setSelectedClientId(null);
    setSelectedClientEmail(null);
    setEditMessage(undefined);
    setSheetOpen(false);
    queryClient.invalidateQueries({ queryKey: ['client-message-status'] });
  };

  const handleMessageSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['client-message-status'] });
    setSheetOpen(false);
    setSelectedClientId(null);
    setSelectedClientEmail(null);
    setEditMessage(undefined);
    toast.success("Your message has been sent to the client.");
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

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
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

  if (clientsError || groupsError) {
    return (
      <CoachLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-coach flex items-center gap-2">
            <Users className="h-8 w-8" /> Clients
          </h1>
          <Card>
            <CardContent className="pt-6">
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                <p className="font-medium">Error loading data</p>
                <p className="text-sm mt-1">There was a problem loading your client data. Please refresh the page or try again later.</p>
              </div>
              <Button 
                className="mt-4" 
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
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
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups?.map((group: Group) => (
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
                        <TableHead 
                          onClick={() => handleSort('email')}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center">
                            Client {renderSortIcon('email')}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('last_workout')}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center">
                            Last Workout {renderSortIcon('last_workout')}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('total_workouts')}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center">
                            Total Workouts {renderSortIcon('total_workouts')}
                          </div>
                        </TableHead>
                        <TableHead 
                          onClick={() => handleSort('program')}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex items-center">
                            Current Program {renderSortIcon('program')}
                          </div>
                        </TableHead>
                        <TableHead>Weekly Message</TableHead>
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
                          <TableCell>
                            {messageStatus[client.id]?.hasMessage ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center text-green-600">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Sent</span>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-500 hover:text-blue-600 ml-1"
                                  onClick={() => handleEditMessage(client.id, client.email)}
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-amber-500 hover:text-amber-600 -ml-2"
                                onClick={() => handleMessageClient(client.id, client.email)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Write
                              </Button>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewClient(client.id, client.email)}
                            >
                              <Info className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md md:max-w-lg">
          {selectedClientId && selectedClientEmail && (
            <>
              {activeTab === 'details' && (
                <ClientDetailView 
                  clientId={selectedClientId} 
                  clientEmail={selectedClientEmail}
                  onClose={handleCloseClientView} 
                />
              )}
              {activeTab === 'message' && (
                <ClientMessageForm
                  coachId={user?.id || ''}
                  clientId={selectedClientId}
                  clientEmail={selectedClientEmail}
                  onClose={handleMessageSaved}
                  editMessage={editMessage}
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </CoachLayout>
  );
};

export default ClientsPage;
