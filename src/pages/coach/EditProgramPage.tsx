
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWorkoutProgram, updateWorkoutProgram } from '@/services/workout-service';
import { toast } from 'sonner';
import ProgramWeeklyMetricsForm from '@/components/coach/ProgramWeeklyMetricsForm';
import { Card, CardContent } from '@/components/ui/card';
import { WorkoutProgramForm } from '@/components/coach/WorkoutProgramForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EditProgramPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [programData, setProgramData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchProgram = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const program = await fetchWorkoutProgram(id);
        setProgramData(program);
      } catch (error) {
        console.error('Error fetching program:', error);
        toast.error('Failed to load program details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgram();
  }, [id]);

  const handleUpdateProgram = async (values: any) => {
    if (!id || !user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      const updatedProgram = await updateWorkoutProgram(id, {
        title: values.title,
        description: values.description
      });
      
      setProgramData(updatedProgram);
      toast.success('Program updated successfully');
    } catch (error) {
      console.error('Error updating program:', error);
      toast.error('Failed to update program');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse">Loading program...</div>
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
          onClick={() => navigate(`/coach-dashboard/workouts/${id}`)}
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Program Details
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Edit Program: {programData.title}</h1>
        
        <div className="max-w-3xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Program Details</TabsTrigger>
              <TabsTrigger value="metrics">Weekly Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <WorkoutProgramForm 
                    onSubmit={handleUpdateProgram} 
                    isSubmitting={isSubmitting}
                    initialData={programData}
                    mode="edit"
                    onCancel={() => navigate(`/coach-dashboard/workouts/${id}`)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <ProgramWeeklyMetricsForm
                    programId={id || ''}
                    programType={programData.program_type || 'Moai Strength'}
                    weeks={programData.weeks || 0}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </CoachLayout>
  );
};

export default EditProgramPage;
