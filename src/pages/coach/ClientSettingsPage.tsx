
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { ProgramAssignmentForm } from '@/components/coach/ProgramAssignmentForm';

const ClientSettingsPage = () => {
  const navigate = useNavigate();
  
  return (
    <CoachLayout>
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={() => navigate('/coach-dashboard/clients')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Client Settings</CardTitle>
            <CardDescription>
              Update client program type and goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramAssignmentForm 
              onAssign={async () => {
                // This is just to update program type, not assign a program
                return Promise.resolve();
              }}
              isSubmitting={false}
            />
          </CardContent>
        </Card>
      </div>
    </CoachLayout>
  );
};

export default ClientSettingsPage;
