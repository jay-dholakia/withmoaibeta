
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchClientWorkoutHistory } from '@/services/client-workout-history-service';
import { fetchClientPrograms } from '@/services/program-service';
import { Loader2, Calendar, Dumbbell, Clock, Award, User, FileX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, formatDistanceToNow, isValid } from 'date-fns';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { DAYS_OF_WEEK } from '@/types/workout';

interface ClientDetailViewProps {
  clientId: string;
  clientEmail: string;
  onClose: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({ 
  clientId, 
  clientEmail,
  onClose 
}) => {
  const { data: workoutHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['client-workout-history', clientId],
    queryFn: () => fetchClientWorkoutHistory(clientId),
    enabled: !!clientId,
  });

  const { data: clientPrograms, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['client-programs', clientId],
    queryFn: () => fetchClientPrograms(clientId),
    enabled: !!clientId,
  });

  const currentProgram = clientPrograms?.find(assignment => 
    !assignment.end_date || new Date(assignment.end_date) >= new Date()
  );

  // Function to safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (!isValid(date) || date.getFullYear() <= 1970) {
      return 'Invalid date';
    }
    
    return format(date, 'MMM d, yyyy');
  };
  
  // Function to safely format relative time
  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (!isValid(date) || date.getFullYear() <= 1970) {
      return '';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="space-y-4">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-coach" />
          Client Details
        </SheetTitle>
        <SheetDescription>
          {clientEmail}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="workouts">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workouts">Workout History</TabsTrigger>
          <TabsTrigger value="programs">Assigned Programs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workouts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-coach" /> Workout History
              </CardTitle>
              <CardDescription>
                Client's completed workouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-coach" />
                </div>
              ) : !workoutHistory || workoutHistory.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <FileX className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No completed workouts found for this client.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Workout</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Rating</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workoutHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {formatDate(entry.completed_at)}
                            <div className="text-xs text-muted-foreground">
                              {formatRelativeTime(entry.completed_at)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.workout?.title || (entry.rest_day ? 'Rest Day' : 'One-off Workout')}
                            <div className="text-xs text-muted-foreground">
                              {entry.workout?.day_of_week !== undefined ? DAYS_OF_WEEK[entry.workout.day_of_week] : ''}
                              {entry.workout?.week?.week_number ? `, Week ${entry.workout.week.week_number}` : ''}
                            </div>
                          </TableCell>
                          <TableCell>
                            {entry.workout?.week?.program?.title || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {entry.rating ? `${entry.rating}/5` : 'Not rated'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="programs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-coach" /> Assigned Programs
              </CardTitle>
              <CardDescription>
                Workout programs assigned to this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPrograms ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-coach" />
                </div>
              ) : !clientPrograms || clientPrograms.length === 0 ? (
                <div className="text-center py-6 bg-muted/30 rounded-lg">
                  <p>No programs have been assigned to this client.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientPrograms.map((assignment) => {
                        const isActive = 
                          !assignment.end_date || 
                          new Date(assignment.end_date) >= new Date();
                        
                        return (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">
                              {assignment.program?.title}
                              <div className="text-xs text-muted-foreground">
                                {assignment.program?.weeks} weeks
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(assignment.start_date)}
                            </TableCell>
                            <TableCell>
                              {assignment.end_date 
                                ? formatDate(assignment.end_date)
                                : 'Ongoing'}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs 
                                ${isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'}`}>
                                {isActive ? 'Active' : 'Completed'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {currentProgram && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-coach" /> Current Program
                </CardTitle>
                <CardDescription>
                  {currentProgram.program?.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p><strong>Started:</strong> {formatDate(currentProgram.start_date)}</p>
                  <p><strong>Duration:</strong> {currentProgram.program?.weeks} weeks</p>
                  <p className="mt-2">{currentProgram.program?.description}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
