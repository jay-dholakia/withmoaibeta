
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import WorkoutsPage from './WorkoutsPage';
import MoaiPage from './MoaiPage';
import LeaderboardPage from './LeaderboardPage';
import SettingsPage from './SettingsPage';
import NotesPage from './NotesPage';

const ClientDashboard = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="workouts" replace />} />
      <Route path="workouts/*" element={<WorkoutsPage />} />
      <Route path="moai" element={<MoaiPage />} />
      <Route path="leaderboard" element={<LeaderboardPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="notes" element={<NotesPage />} />
    </Routes>
  );
};

export default ClientDashboard;
