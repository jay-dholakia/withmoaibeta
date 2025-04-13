
import React from 'react';
import { CoachLayout } from '@/layouts/CoachLayout';
import { ExerciseManagementPage as AdminExerciseManagementPage } from '@/pages/admin/ExerciseManagementPage';

const ExerciseManagementPage: React.FC = () => {
  return (
    <CoachLayout>
      <h1 className="text-3xl font-bold text-coach mb-6">Exercise Management</h1>
      <AdminExerciseManagementPage />
    </CoachLayout>
  );
};

export default ExerciseManagementPage;
