
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  Edit, 
  Users, 
  PlusCircle,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkoutProgram, fetchWorkoutWeeks } from '@/services/workout-service';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ProgramDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [programData, setProgramData] = useState<any>(null);
  const [weekData, setWeekData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const [program, weeks] = await Promise.all([
          fetchWorkoutProgram(id),
          fetchWorkoutWeeks(id)
        ]);
        
        setProgramData(program);
        setWeekData(weeks);
      } catch (error) {
        console.error('Error fetching program details:', error);
        toast.error('Failed to load program details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse">Loading program details...</div>
          </div>
        </div>
      </CoachLayout>
    );
  }

  if (!programData) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
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
            <h1 className="text-2xl font-bold">{programData.title}</h1>
            {programData.description && (
              <p className="text-muted-foreground mt-1">{programData.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/coach-dashboard/program-assignment', { state: { programId: id } })}
            >
              <Users className="h-4 w-4 mr-2" />
              Assign
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/coach-dashboard/workouts/${id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold">Program Weeks</h2>
            <Badge variant="outline" className="bg-slate-100">
              {weekData.length}/{programData.weeks} Weeks
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: programData.weeks }, (_, i) => {
              const weekNumber = i + 1;
              const weekEntry = weekData.find(w => w.week_number === weekNumber);
              
              return (
                <Card key={weekNumber} className={weekEntry ? 'border-slate-200' : 'border-dashed border-slate-300'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Week {weekNumber}</CardTitle>
                    {weekEntry && weekEntry.title && weekEntry.title !== `Week ${weekNumber}` && (
                      <CardDescription>{weekEntry.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pb-0">
                    {weekEntry ? (
                      <>
                        {weekEntry.description && (
                          <p className="text-sm text-muted-foreground">{weekEntry.description}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No content added yet</p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end pt-2">
                    {weekEntry ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/coach-dashboard/workouts/week/${weekEntry.id}`)}
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/coach-dashboard/workouts/${id}/create-week`, { 
                          state: { weekNumber }
                        })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Content
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </CoachLayout>
  );
};

export default ProgramDetailPage;
