
import React from 'react';
import { useParams } from 'react-router-dom';
import { CoachLayout } from '@/layouts/CoachLayout';

const StandaloneWorkoutDetailsPage: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();

  return (
    <CoachLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Workout Template Details</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Viewing workout template ID: {workoutId}</p>
          {/* Additional workout details will be displayed here */}
        </div>
      </div>
    </CoachLayout>
  );
};

export default StandaloneWorkoutDetailsPage;
