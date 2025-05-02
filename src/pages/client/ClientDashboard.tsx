
import React, { useEffect } from 'react';
import { Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { ClientLayout } from '@/layouts/ClientLayout';
import WorkoutsPage from './WorkoutsPage';
import MoaiPage from './MoaiPage';
import LeaderboardPage from './LeaderboardPage';
import SettingsPage from './SettingsPage';
import ActivityFeedPage from './ActivityFeedPage';
import ProfileEditor from './ProfileEditor';
import PrivacyPolicyPage from './PrivacyPolicyPage';
import TermsOfServicePage from './TermsOfServicePage';
import NotFound from '@/pages/NotFound';

// Storage key for the last main tab
const LAST_CLIENT_TAB_KEY = 'last_client_tab';

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Remember the current main section the user is in
  useEffect(() => {
    const basePath = location.pathname.split('/').slice(0, 3).join('/');
    
    // Only save the main section paths
    if ([
      '/client-dashboard/workouts',
      '/client-dashboard/moai',
      '/client-dashboard/leaderboard',
      '/client-dashboard/activity-feed',
      '/client-dashboard/settings'
    ].includes(basePath)) {
      localStorage.setItem(LAST_CLIENT_TAB_KEY, basePath);
      console.log('ClientDashboard: Saved tab path:', basePath);
    }
  }, [location.pathname]);
  
  // Redirect to last tab if landing on index
  useEffect(() => {
    if (location.pathname === '/client-dashboard') {
      const lastTab = localStorage.getItem(LAST_CLIENT_TAB_KEY);
      if (lastTab) {
        console.log('ClientDashboard: Restoring last tab:', lastTab);
        navigate(lastTab, { replace: true });
      } else {
        // Default to moai if no saved tab
        navigate('/client-dashboard/moai', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  return (
    <ClientLayout>
      <div className="w-full">
        <Routes>
          <Route index element={<Navigate to="moai" replace />} />
          <Route path="workouts/*" element={<WorkoutsPage />} />
          <Route path="moai" element={<MoaiPage />} />
          <Route path="moai/:groupId" element={<MoaiPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="activity-feed" element={<ActivityFeedPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/edit-profile" element={<ProfileEditor />} />
          <Route path="settings/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="settings/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="notes" element={<Navigate to="/client-dashboard/activity-feed" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </ClientLayout>
  );
};

export default ClientDashboard;
