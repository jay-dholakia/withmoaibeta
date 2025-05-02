import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchWorkoutProgram } from '@/services/program-service';

const ProgramDetailPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgramDetails = async () => {
      if (!programId) return;

      setIsLoading(true);
      try {
        const programData = await fetchWorkoutProgram(programId);
        setProgram(programData);
      } catch (error) {
        console.error('Error loading program details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgramDetails();
  }, [programId]);

  if (isLoading) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Loading program details...
        </div>
      </CoachLayout>
    );
  }

  if (!program) {
    return (
      <CoachLayout>
        <div className="container mx-auto p-4">
          Program not found
        </div>
      </CoachLayout>
    );
  }

  return (
    <CoachLayout>
      <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={() => navigate('/coach-dashboard/workouts')}>
          Back to Programs
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{program.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Description: {program.description || 'No description'}</p>
            <p>Weeks: {program.weeks}</p>
            <Button onClick={() => navigate(`/coach-dashboard/workouts/${programId}/edit`)}>
              Edit Program
            </Button>
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default ProgramDetailPage;
