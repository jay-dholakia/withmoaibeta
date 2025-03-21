
import React from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupList from '@/components/admin/GroupList';
import GroupForm from '@/components/admin/GroupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GroupsPage: React.FC = () => {
  const { userType } = useAuth();
  const navigate = useNavigate();
  
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
    <AdminDashboardLayout title="Groups Management">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="list">All Groups</TabsTrigger>
          <TabsTrigger value="create">Create Group</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <GroupList />
        </TabsContent>
        
        <TabsContent value="create">
          <GroupForm />
        </TabsContent>
      </Tabs>
    </AdminDashboardLayout>
  );
};

export default GroupsPage;
