
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import LogCardioForm from '@/components/client/LogCardioForm';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const LogCardioPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/client-dashboard/workouts');
  };

  return (
    <PageTransition>
      <div className="container max-w-md mx-auto pb-20">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-2" role="img" aria-label="Cardio">🚴</span>
            Log Cardio Activity
          </h1>
          
          <LogCardioForm onComplete={handleComplete} />
        </Card>
      </div>
    </PageTransition>
  );
};

export default LogCardioPage;
