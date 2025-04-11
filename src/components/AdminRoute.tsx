
import React from 'react';
import RequireAuth from './RequireAuth';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  return <RequireAuth allowedUserTypes={['admin']}>{children}</RequireAuth>;
};

export default AdminRoute;
