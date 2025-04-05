
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import LogRunForm from '@/components/client/LogRunForm';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const LogRunPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate('/client-dashboard/workouts');
  };

  return (
    <PageTransition>
      <div className="container max-w-md mx-auto pb-20">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-2" role="img" aria-label="Running">🏃</span>
            Log Run Activity
          </h1>
          
          <LogRunForm onComplete={handleComplete} />
        </Card>
      </div>
    </PageTransition>
  );
};

export default LogRunPage;
