
import React from 'react';
import { Container } from '@/components/ui/container';
import { CoachMessageCard } from '@/components/client/CoachMessageCard';
import { useAuth } from '@/contexts/AuthContext';
import { WeekProgressSection } from '@/components/client/WeekProgressSection';

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  return (
    <Container className="px-0 sm:px-4 mx-auto w-full max-w-screen-md">
      <div className="w-full">
        {user && <CoachMessageCard userId={user.id} />}
        
        <WeekProgressSection 
          showTeam={true} 
          showPersonal={true}
          workoutTypesMap={{}}
        />
      </div>
    </Container>
  );
};

export default LeaderboardPage;
