
import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import WorkoutsPage from './WorkoutsPage';
import MoaiPage from './MoaiPage';
import LeaderboardPage from './LeaderboardPage';
import SettingsPage from './SettingsPage';
import NotesPage from './NotesPage';
import { useIsMobile } from '@/hooks/use-mobile';

const ClientDashboard = () => {
  const isMobile = useIsMobile();
  console.log("ClientDashboard component rendering, isMobile:", isMobile);
  
  return (
    <ClientLayout>
      <Routes>
        <Route index element={<Navigate to="workouts" replace />} />
        <Route path="workouts/*" element={<WorkoutsPage />} />
        <Route path="moai" element={<MoaiPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notes" element={<NotesPage />} />
      </Routes>
    </ClientLayout>
  );
};

export default ClientDashboard;
