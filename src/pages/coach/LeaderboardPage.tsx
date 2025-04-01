
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CoachLayout } from '@/layouts/CoachLayout';
import { Trophy } from 'lucide-react';

const LeaderboardPage = () => {
  const { user } = useAuth();

  return (
    <CoachLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-coach" />
          <h1 className="text-3xl font-bold text-coach">Leaderboards</h1>
        </div>

        <div className="bg-muted/30 p-8 rounded-lg text-center">
          <p className="text-lg mb-2">Leaderboard functionality is currently unavailable.</p>
          <p className="text-muted-foreground">This feature will be implemented in a future update.</p>
        </div>
      </div>
    </CoachLayout>
  );
};

export default LeaderboardPage;
