
import React from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import ActiveWorkout from '@/components/client/ActiveWorkout'; 
import { useParams } from 'react-router-dom';

const ClientWorkoutDetailsPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  
  return (
    <ClientLayout>
      <div className="container mx-auto py-6">
        <ActiveWorkout />
      </div>
    </ClientLayout>
  );
};

export default ClientWorkoutDetailsPage;
