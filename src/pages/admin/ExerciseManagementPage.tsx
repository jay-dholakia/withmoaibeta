
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { ExerciseManagement } from '@/components/admin/ExerciseManagement';

const ExerciseManagementPage = () => {
  return (
    <AdminDashboardLayout title="Exercise Management">
      <ExerciseManagement />
    </AdminDashboardLayout>
  );
};

export default ExerciseManagementPage;
