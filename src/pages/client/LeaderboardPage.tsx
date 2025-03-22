import React from 'react';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';

const LeaderboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Dashboard</h1>
      
      <WeekProgressSection />
      
      {/* Additional dashboard content would go here */}
      <div className="bg-muted/30 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Leaderboard content coming soon</p>
      </div>
    </div>
  );
};

export default LeaderboardPage;
