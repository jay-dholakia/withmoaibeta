
import React, { useEffect } from 'react';
import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GroupList from '@/components/admin/GroupList';
import GroupForm from '@/components/admin/GroupForm';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createDefaultMoaiGroupIfNeeded } from '@/services/group-service';
import { toast } from 'sonner';

const GroupsPage: React.FC = () => {
  const { userType, user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we need to create default groups for testing
  useEffect(() => {
    const checkAndCreateDefaultGroups = async () => {
      try {
        if (!user?.id) {
          console.error('User ID is required to create a group');
          return;
        }
        
        // Create default Moai Strength group
        const strengthResult = await createDefaultMoaiGroupIfNeeded(user.id, 'strength');
        if (strengthResult.success && strengthResult.created) {
          toast.success('Created default Moai Strength group for testing');
        }
        
        // Create default Moai Run group
        const runResult = await createDefaultMoaiGroupIfNeeded(user.id, 'run');
        if (runResult.success && runResult.created) {
          toast.success('Created default Moai Run group for testing');
        }
      } catch (error) {
        console.error('Unexpected error in checkAndCreateDefaultGroups:', error);
      }
    };
    
    // Only run this for admin users
    if (userType === 'admin') {
      checkAndCreateDefaultGroups();
    }
  }, [userType, user]);
  
  // Redirect if not admin
  useEffect(() => {
    if (userType !== 'admin') {
      navigate('/admin');
    }
  }, [userType, navigate]);

  if (userType !== 'admin') {
    return null;
  }

  return (
    <AdminDashboardLayout title="Groups Management">
      <div className="w-full">
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
      </div>
    </AdminDashboardLayout>
  );
};

export default GroupsPage;
