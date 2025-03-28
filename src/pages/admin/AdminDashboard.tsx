
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Users, UserPlus, UserSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userType } = useAuth();
  
  // Redirect if not admin
  React.useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  if (userType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Admin Dashboard">
      <div className="w-full">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-l-4 border-l-admin w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Invitations</CardTitle>
              <CardDescription>
                Manage pending invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin-dashboard/invitations')}
              >
                <Mail className="w-4 h-4 mr-2" />
                View Invitations
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-violet-500 w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Groups</CardTitle>
              <CardDescription>
                Manage client groups and coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin-dashboard/groups')}
              >
                <UserSquare className="w-4 h-4 mr-2" />
                Manage Groups
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-client w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Clients</CardTitle>
              <CardDescription>
                Manage registered clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin-dashboard/clients')}
              >
                <Users className="w-4 h-4 mr-2" />
                View Clients
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-coach w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Coaches</CardTitle>
              <CardDescription>
                Manage registered coaches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/admin-dashboard/coaches')}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                View Coaches
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;
