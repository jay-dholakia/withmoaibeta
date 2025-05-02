
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronLeft, 
  Plus, 
  Users,
  Edit,
  Dumbbell,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkoutProgram, fetchWorkoutWeeks, fetchWorkoutsForWeek } from '@/services/workout-service';
import { Badge } from '@/components/ui/badge';

const WorkoutProgramDetailPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [program, setProgram] = useState<any>(null);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [weekWorkouts, setWeekWorkouts] = useState<Record<string, any[]>>({});

  console.log("WorkoutProgramDetailPage: Component rendered with programId:", programId);
  console.log("WorkoutProgramDetailPage: Current Auth User:", user?.id);

  useEffect(() => {
    const loadProgramDetails = async () => {
      if (!programId) {
        console.error("No program ID provided in URL parameters");
        setError("No program ID provided");
        setIsLoading(false);
        return;
      }
      
      if (programId === 'create') {
        console.error("Invalid program ID: 'create' is not a valid UUID");
        setError("Invalid program ID");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching program details for ID:", programId);
        setIsLoading(true);
        
        const programData = await fetchWorkoutProgram(programId);
        console.log("Program data received:", programData);
        
        if (!programData) {
          console.error("Program not found");
          setError("Program not found or you don't have access to it");
          setIsLoading(false);
          return;
        }
        
        setProgram(programData);
        
        const weeksData = await fetchWorkoutWeeks(programId);
        console.log("Weeks data received:", weeksData);
        
        if (!weeksData) {
          console.warn("Weeks data is null or undefined, setting empty array");
          setWeeks([]);
        } else {
          setWeeks(weeksData);
          
          // Fetch workouts for each week
          const workoutsData: Record<string, any[]> = {};
          
          for (const week of weeksData) {
            const weekWorkouts = await fetchWorkoutsForWeek(week.id);
            workoutsData[week.id] = weekWorkouts || [];
          }
          
          setWeekWorkouts(workoutsData);
        }
        
      } catch (error) {
        console.error('Error loading program details:', error);
        setError("Failed to load program details. Please try again.");
        toast.error('Failed to load program details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProgramDetails();
  }, [programId, navigate]);

  // Function to get workout type badge
  const getWorkoutTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      cardio: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      mobility: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      flexibility: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    };
    
    return (
      <Badge 
        variant="outline" 
        className={`ml-2 ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}
      >
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
      </Badge>
    );
  };

  console.log("WorkoutProgramDetailPage: Current state:", { 
    isLoading, 
    error, 
    programExists: !!program,
    weeksCount: weeks?.length 
  });

  if (error) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center p-10">
            <h2 className="text-xl font-semibold mb-4 text-red-500">Error</h2>
            <p className="mb-6">{error}</p>
            <Button onClick={() => navigate('/coach-dashboard/workouts')}>
              Back to Programs
            </Button>
          </div>
        </div>
      </CoachLayout>
    );
  }

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p>Loading program details...</p>
            </div>
          </div>
        </div>
      </CoachLayout>
    );
  }

  if (!program) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center p-10">
            <h2 className="text-xl font-medium mb-2">Program not found</h2>
            <p className="text-muted-foreground mb-4">
              The program you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate('/coach-dashboard/workouts')}>
              Back to Programs
            </Button>
          </div>
        </div>
      </CoachLayout>
    );
  }

  const ProgramTypeIcon = program?.program_type === 'run' ? '🏃' : <Dumbbell className="h-3.5 w-3.5" />;

  return (
    <CoachLayout>
      <div className="container mx-auto px-4 py-6">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-6 gap-1" 
          onClick={() => navigate('/coach-dashboard/workouts')}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Programs
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{program.title}</h1>
              <Badge variant="outline" className="flex items-center gap-1">
                {typeof ProgramTypeIcon === 'string' ? (
                  <span className="mr-1">{ProgramTypeIcon}</span>
                ) : (
                  ProgramTypeIcon
                )}
                <span>Moai {program.program_type === 'run' ? 'Run' : 'Strength'}</span>
              </Badge>
            </div>
            {program.description && (
              <p className="text-muted-foreground mt-1">{program.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/coach-dashboard/workouts/${programId}/assign`)}
            >
              <Users className="h-4 w-4 mr-2" />
              Assign
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/coach-dashboard/workouts/${programId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold">Program Weeks</h2>
            {program.weeks && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100">
                {weeks.length}/{program.weeks} Weeks
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {program.weeks && Array.from({ length: program.weeks }, (_, i) => {
              const weekNumber = i + 1;
              const weekEntry = weeks.find(w => w.week_number === weekNumber);
              const weekId = weekEntry?.id;
              const workouts = weekId ? weekWorkouts[weekId] || [] : [];
              
              return (
                <Card key={weekNumber} className={weekEntry ? 'border-slate-200' : 'border-dashed border-slate-300'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>Week {weekNumber}</span>
                      {weekEntry && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/workout-weeks/${weekEntry.id}`)}
                          className="h-8"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                    {weekEntry && weekEntry.title && weekEntry.title !== `Week ${weekNumber}` && (
                      <p className="text-sm text-muted-foreground">{weekEntry.title}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pb-4">
                    {weekEntry ? (
                      <div>
                        {weekEntry.description && (
                          <p className="text-sm text-muted-foreground mb-3">{weekEntry.description}</p>
                        )}
                        
                        {workouts.length > 0 ? (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium">Workouts:</h3>
                            <ul className="space-y-1.5">
                              {workouts.map(workout => (
                                <li key={workout.id} className="text-sm flex items-center">
                                  <span>Day {workout.day_of_week}: {workout.title}</span>
                                  {workout.workout_type && getWorkoutTypeBadge(workout.workout_type)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic mt-2">No workouts added yet</p>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/workout-weeks/${weekEntry.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Edit Week
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground italic mb-2">No content added yet</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/coach-dashboard/workouts/${programId}/create-week`, { 
                            state: { weekNumber }
                          })}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Content
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </CoachLayout>
  );
};

export default WorkoutProgramDetailPage;
