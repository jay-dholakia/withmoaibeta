
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import WorkoutsPage from './WorkoutsPage';
import MoaiPage from './MoaiPage';
import LeaderboardPage from './LeaderboardPage';
import SettingsPage from './SettingsPage';
import NotesPage from './NotesPage';
import ProfileEditor from './ProfileEditor';
import LogCardioPage from './LogCardioPage';

const ClientDashboard = () => {
  console.log("ClientDashboard component rendering with path:", window.location.pathname);
  
  return (
    <ClientLayout>
      <div className="w-full">
        <Routes>
          <Route index element={<Navigate to="moai" replace />} />
          <Route path="workouts/*" element={<WorkoutsPage />} />
          <Route path="moai" element={<MoaiPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/edit-profile" element={<ProfileEditor />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="log-cardio" element={<LogCardioPage />} />
          <Route path="*" element={<Navigate to="moai" replace />} />
        </Routes>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
