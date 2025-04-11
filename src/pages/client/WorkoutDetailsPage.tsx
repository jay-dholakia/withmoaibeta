
import React from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';

const ClientWorkoutDetailsPage: React.FC = () => {
  return (
    <ClientLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Workout Details</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p>Client workout details will be displayed here.</p>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientWorkoutDetailsPage;
