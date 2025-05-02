
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Database, Users, Group, Layout, FileText, Settings } from 'lucide-react';

const AdminToolsPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <AdminDashboardLayout title="Admin Tools">
      <div className="mb-6">
        <p className="text-muted-foreground">
          This is a hidden admin area for super users. You have access to advanced management tools.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-admin">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">User Management</CardTitle>
            <CardDescription>
              View and manage all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/users')}
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Group Management</CardTitle>
            <CardDescription>
              Manage all groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/groups')}
            >
              <Group className="w-5 h-5 mr-2" />
              Manage Groups
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-coach">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Program Management</CardTitle>
            <CardDescription>
              Manage all workout programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/programs')}
            >
              <Layout className="w-5 h-5 mr-2" />
              Manage Programs
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">System Settings</CardTitle>
            <CardDescription>
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/settings')}
            >
              <Settings className="w-5 h-5 mr-2" />
              System Settings
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Database Access</CardTitle>
            <CardDescription>
              Direct database operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/database')}
            >
              <Database className="w-5 h-5 mr-2" />
              Database Console
            </Button>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Audit Logs</CardTitle>
            <CardDescription>
              View system audit logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/admin-tools/audit-logs')}
            >
              <FileText className="w-5 h-5 mr-2" />
              View Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminToolsPage;
