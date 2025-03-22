
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientLayout } from './layouts/ClientLayout';
import { CoachLayout } from './layouts/CoachLayout';
import { NotFound } from './components/NotFound';
import ClientDashboard from './pages/client/ClientDashboard';
import CoachDashboard from './pages/coach/CoachDashboard';
import ClientsPage from './pages/coach/ClientsPage';
import LeaderboardPage from './pages/coach/LeaderboardPage';

function App() {
  return (
    <Routes>
      {/* Client Routes */}
      <Route path="/" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
      <Route path="/client-dashboard/*" element={<ClientLayout><ClientDashboard /></ClientLayout>} />
      
      {/* Coach Dashboard Routes */}
      <Route path="/coach-dashboard" element={<CoachLayout><CoachDashboard /></CoachLayout>} />
      <Route path="/coach-dashboard/clients" element={<CoachLayout><ClientsPage /></CoachLayout>} />
      <Route path="/coach-dashboard/leaderboards" element={<CoachLayout><LeaderboardPage /></CoachLayout>} />
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
