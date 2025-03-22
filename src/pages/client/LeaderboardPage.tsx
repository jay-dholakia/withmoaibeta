
import React from 'react';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';

const LeaderboardPage = () => {
  return (
    <div className="container max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Team Progress</h1>
      
      <WeekProgressSection />
      
      {/* Additional leaderboard content would go here */}
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <p className="text-muted-foreground">Detailed leaderboard data coming soon</p>
      </div>
    </div>
  );
};

export default LeaderboardPage;
