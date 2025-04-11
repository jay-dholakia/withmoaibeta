
import React from 'react';
import RequireAuth from './RequireAuth';

interface CoachRouteProps {
  children: React.ReactNode;
}

const CoachRoute: React.FC<CoachRouteProps> = ({ children }) => {
  return <RequireAuth allowedUserTypes={['coach']}>{children}</RequireAuth>;
};

export default CoachRoute;
