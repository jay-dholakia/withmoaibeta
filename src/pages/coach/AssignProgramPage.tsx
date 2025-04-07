
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';
import { AssignProgramForm } from '@/components/coach/AssignProgramForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const AssignProgramPage = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  return (
    <CoachLayout>
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate(`/coach-dashboard/workouts${programId ? `/${programId}` : ''}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Program
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Assign Program</CardTitle>
            <CardDescription>
              Assign a workout program to a client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignProgramForm initialProgramId={programId} />
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default AssignProgramPage;
