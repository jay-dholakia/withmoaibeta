
import React from 'react';
import RequireAuth from './RequireAuth';

interface ClientRouteProps {
  children: React.ReactNode;
}

const ClientRoute: React.FC<ClientRouteProps> = ({ children }) => {
  return <RequireAuth allowedUserTypes={['client']}>{children}</RequireAuth>;
};

export default ClientRoute;
