
import React from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import WorkoutsPage from './WorkoutsPage';
import MoaiPage from './MoaiPage';
import LeaderboardPage from './LeaderboardPage';
import SettingsPage from './SettingsPage';
import NotesPage from './NotesPage';
import ProfileEditor from './ProfileEditor';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import NotFound from '@/pages/NotFound';

const ClientDashboard = () => {
  const location = useLocation();
  
  return (
    <ClientLayout>
      <div className="w-full">
        <Routes>
          <Route index element={<Navigate to="moai" replace />} />
          <Route path="workouts/*" element={<WorkoutsPage />} />
          <Route path="moai" element={<MoaiPage />} />
          <Route path="moai/:groupId" element={<MoaiPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/edit-profile" element={<ProfileEditor />} />
          <Route path="settings/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="settings/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="workouts/active/:workoutId" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
